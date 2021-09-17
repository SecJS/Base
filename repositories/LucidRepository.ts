import { DateTime } from 'luxon'
import { BadRequestException, NotFoundException } from '@secjs/exceptions'
import {
  ApiRequestContract,
  IncludesContract,
  OrderByContract,
  WhereContract,
  PaginationContract,
} from '@secjs/contracts'

export abstract class LucidRepository<TModel> {
  protected abstract Model: TModel | any

  private factoryRequest(query: any, data?: ApiRequestContract) {
    if (!data) {
      return
    }

    const { where, orderBy, includes } = data

    if (where) {
      this.factoryWhere(query, where)
    }

    if (orderBy) {
      this.factoryOrderBy(query, orderBy)
    }

    if (includes) {
      this.factoryIncludes(query, includes)
    }
  }

  private factoryWhere(query: any, where: WhereContract) {
    Object.keys(where).forEach(key => {
      const value = where[key]

      query.where(key, value)
    })
  }

  private factoryOrderBy(query: any, orderBy: OrderByContract) {
    Object.keys(orderBy).forEach(key => {
      const value = orderBy[key]

      query.orderBy(key, value)
    })
  }

  private factoryIncludes(query: any, includes: IncludesContract[]) {
    includes.forEach(include => {
      query.preload(include.relation, (includeQuery: any) => {
        this.factoryRequest(includeQuery, include)
      })
    })
  }

  /**
   * Retrieves multiple data from Database
   *
   * @param pagination The pagination used to paginate data
   * @param options The options used to filter data
   * @return The paginated response with models retrieved
   */
  async getAll(
    pagination?: PaginationContract,
    data?: ApiRequestContract,
  ): Promise<TModel[]> {
    const Query = this.Model.query()

    if (pagination) {
      Query.paginate(pagination.page || 0, pagination.limit || 10)
    }

    this.factoryRequest(Query, data)

    return Query
  }

  /**
   * Retrieves one data from Database
   *
   * @param id The id of the model
   * @param options The options used to filter data
   * @return The model founded or null
   */
  async getOne(
    id?: string | null,
    data?: ApiRequestContract,
  ): Promise<TModel | undefined> {
    const Query = this.Model.query()

    if (id) {
      Query.where('id', id)
    }

    this.factoryRequest(Query, data)

    return Query.first()
  }

  /**
   * Store one in database
   *
   * @param body The body that is going to be used to create
   * @return The model created with body information
   */
  async createOne(payload: TModel): Promise<TModel> {
    return this.Model.create(payload)
  }

  /**
   * Update one from database
   *
   * @param id The id or model that is going to be updated
   * @param body The body that is going to be used to update
   * @return The model updated with body information
   * @throws NotFoundException if cannot find model with ID
   */
  async updateOne(id: string, payload: any): Promise<TModel> {
    const model = (await this.getOne(id)) as any

    if (!model) {
      throw new NotFoundException('The model id has not been found to update.')
    }

    Object.keys(payload).forEach(key => {
      model[key] = payload[key]
    })

    return model.save()
  }

  /**
   * Delete one from database
   *
   * @param id The id or model that is going to be deleted
   * @param soft If is a soft delete or a true delete from database
   * @return The model soft deleted or void if deleted
   * @throws NotFoundException if cannot find model with ID
   * @throws BadRequestException if model is already deleted
   */
  async deleteOne(id: string): Promise<TModel> {
    const model = (await this.getOne(id)) as any

    if (!model) {
      throw new NotFoundException('The model id has not been found to delete.')
    }

    if (model.deletedAt) {
      throw new BadRequestException('The model id has been already deleted.')
    }

    model.deletedAt = DateTime.fromJSDate(new Date())

    return model.save()
  }
}
