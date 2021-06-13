import { DateTime } from 'luxon'
import { ApiRequestContract, IncludesContract, OrderByContract, WhereContract, PaginationContract } from '@secjs/contracts'

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

  async getOne(id?: string | null, data?: ApiRequestContract): Promise<TModel | undefined> {
    const Query = this.Model.query()

    if (id) {
      Query.where('id', id)
    }

    this.factoryRequest(Query, data)

    return Query.first()
  }

  async getAll(pagination?: PaginationContract, data?: ApiRequestContract): Promise<TModel[]> {
    const Query = this.Model.query()

    if (pagination) {
      Query.paginate(pagination.page || 0, pagination.limit || 10)
    }

    this.factoryRequest(Query, data)

    return Query
  }

  async create(payload: TModel): Promise<TModel> {
    return this.Model.create(payload)
  }

  async update(id: string, payload: any): Promise<TModel> {
    const model = await this.getOne(id) as any

    if (!model) {
      throw new Error('MODEL_NOT_FOUND_UPDATE')
    }

    Object.keys(payload).map((key) => {
      model[key] = payload[key]
    })

    return model.save()
  }

  async delete(id: string): Promise<TModel> {
    const model = await this.getOne(id) as any

    if (!model) {
      throw new Error('MODEL_NOT_FOUND_DELETE')
    }

    model.deletedAt = DateTime.fromJSDate(new Date())

    return model.save()
  }
}
