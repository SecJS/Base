import {
  WhereContract,
  OrderByContract,
  IncludesContract,
  PaginationContract,
  ApiRequestContract,
  PaginatedResponse,
} from '@secjs/contracts'

import { paginate } from '@secjs/utils'

export abstract class PrismaRepository<TModel> {
  protected abstract Model: TModel | any

  protected abstract wheres: string[]
  protected abstract relations: string[]

  private factoryRequest(options?: ApiRequestContract) {
    const prismaQuery: any = {}

    if (!options) {
      return {}
    }

    const { where, orderBy, includes, isInternRequest = true } = options

    if (where && Object.keys(where).length) {
      prismaQuery.where = this.factoryWhere(where, isInternRequest)
    }

    if (orderBy && Object.keys(orderBy).length) {
      prismaQuery.orderBy = this.factoryOrderBy(orderBy)
    }

    if (includes && includes.length) {
      prismaQuery.include = this.factoryIncludes(includes, isInternRequest)
    }

    return prismaQuery
  }

  private factoryWhere(where: WhereContract, isInternRequest: boolean) {
    Object.keys(where).forEach(key => {
      const value = where[key]

      if (!isInternRequest && !this.wheres?.includes(key)) {
        throw new Error(`It is not possible to filter by ${key}`)
      }

      if (value === 'null') {
        where[key] = null

        return
      }

      if (value === '!null') {
        where[key] = { not: null }

        return
      }

      if (typeof value === 'string' && value.includes('%')) {
        value.replace('%', '')

        where[key] = { contains: value }

        return
      }

      if (typeof value === 'string' && value.includes(',')) {
        if (value.startsWith('!')) {
          where[key] = {
            notIn: value.split(',').map(v => v.replace(/\s/g, '')),
          }

          return
        }

        where[key] = { in: value.split(',').map(v => v.replace(/\s/g, '')) }

        return
      }

      if (typeof value === 'string' && value.includes('->')) {
        const firstValue = value.split('->')[0].replace(/\s/g, '')
        const secondValue = value.split('->')[1].replace(/\s/g, '')

        where[key] = { gte: firstValue, lte: secondValue }
      }
    })

    return where
  }

  private factoryOrderBy(orderBy: OrderByContract) {
    return orderBy
  }

  private factoryIncludes(
    includes: IncludesContract[],
    isInternRequest: boolean,
  ) {
    const include: any = {}

    includes.forEach(i => {
      if (!isInternRequest && !this.relations?.includes(i.relation)) {
        throw new Error(`It is not possible to include ${i.relation} relation`)
      }

      include[i.relation] = this.factoryRequest(i)
    })

    return include
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
    options?: ApiRequestContract,
  ): Promise<PaginatedResponse<TModel> | { data: TModel[]; total: number }> {
    const queryItems = this.factoryRequest(options)
    const total = await this.Model.count({ where: queryItems.where })

    if (pagination) {
      queryItems.skip = pagination.page || 0
      queryItems.take = pagination.limit || 10

      return paginate(await this.Model.findMany(queryItems), total, {
        page: queryItems.skip,
        limit: queryItems.take,
        resourceUrl: pagination.resourceUrl,
      })
    }

    return {
      total,
      data: await this.Model.findMany(queryItems),
    }
  }

  /**
   * Retrieves one data from Database
   *
   * @param id The id of the model
   * @param options The options used to filter data
   * @return The model founded or undefined
   */
  async getOne(
    id?: string,
    options?: ApiRequestContract,
  ): Promise<TModel | null> {
    const query = this.factoryRequest(options)

    if (id) {
      query.where ? (query.where.id = id) : (query.where = { id })
    }

    return this.Model.findFirst(query)
  }

  /**
   * Store one in database
   *
   * @param body The body that is going to be used to store
   * @return The model created with body information
   */
  async storeOne(body: any): Promise<TModel> {
    return this.Model.create({ data: body })
  }

  /**
   * Update one from database
   *
   * @param id The id or model that is going to be updated
   * @param body The body that is going to be used to update
   * @return The model updated with body information
   * @throws Error if cannot find model with ID
   */
  async updateOne(id: any, body: any): Promise<TModel> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new Error('MODEL_NOT_FOUND_UPDATE')
      }
    }

    return this.Model.update({ data: body, where: { id: model.id } })
  }

  /**
   * Delete one from database
   *
   * @param id The id or model that is going to be deleted
   * @param soft If is a soft delete or a true delete from database
   * @return The model soft deleted or void if deleted
   * @throws Error if cannot find model with ID
   */
  async deleteOne(id: any, soft = true): Promise<TModel | void> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new Error('MODEL_NOT_FOUND_DELETE')
      }
    }

    if (soft) {
      if (model.deletedAt) {
        throw new Error('MODEL_IS_ALREADY_DELETED')
      }

      return this.updateOne(model, { deletedAt: new Date() })
    }

    return this.Model.delete({ where: { id: model.id } })
  }
}
