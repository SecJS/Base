import {
  ApiRequestContract,
  IncludesContract,
  OrderByContract,
  WhereContract,
  PaginationContract,
  PaginatedResponse,
} from '@secjs/contracts'
import { Parser, paginate } from '@secjs/utils'
import { Repository, SelectQueryBuilder } from 'typeorm'

export abstract class TypeOrmRepository<TModel> extends Repository<TModel> {
  protected abstract Model: any
  protected abstract wheres: any[]
  protected abstract relations: any[]

  private factoryRequest(Query: SelectQueryBuilder<TModel>, options?: ApiRequestContract, alias?: string) {
    if (!options) {
      return
    }

    const { where, orderBy, includes, isInternRequest = true } = options

    if (includes) {
      this.factoryIncludes(Query, includes, alias, isInternRequest)
    }

    if (where) {
      this.factoryWhere(Query, where, alias, isInternRequest)
    }

    if (orderBy) {
      this.factoryOrderBy(Query, orderBy, alias)
    }
  }

  private factoryWhere(
    query: SelectQueryBuilder<TModel>,
    where: WhereContract,
    alias?: string,
    isInternRequest?: boolean,
  ) {
    if (!alias) {
      alias = query.alias
    }

    Object.keys(where).forEach(key => {
      const value = where[key]

      if (!isInternRequest && !this.wheres?.includes(key)) {
        throw new Error(`According to ${this.Model.constructor.name} model, it is not possible to filter by ${key}`)
      }

      if (value === 'null') {
        query.andWhere(`${alias}.${key} IS NULL`)

        return
      }

      if (value === '!null') {
        query.andWhere(`${alias}.${key} IS NOT NULL`)

        return
      }

      if (Array.isArray(value)) {
        query.andWhere(`${alias}.${key} ::jsonb @> :${key}`, {
          [key]: JSON.stringify(value),
        })

        return
      }

      const valueInString = value.toString()

      if (valueInString.indexOf(',') > 0) {
        if (valueInString.indexOf('!') > 0) {
          valueInString.replace('!', '')

          query.andWhere(`${alias}.${key} NOT IN (:...${key})`, {
            [key]: new Parser().stringToArray(valueInString, ','),
          })

          return
        }

        query.andWhere(`${alias}.${key} IN (:...${key})`, {
          [key]: new Parser().stringToArray(valueInString, ','),
        })

        return
      }

      query.andWhere(`${alias}.${key} = '${value}'`)
    })

    return query
  }

  private factoryOrderBy(
    query: SelectQueryBuilder<TModel>,
    orderBy: OrderByContract,
    alias?: string,
  ) {
    if (!alias) {
      alias = query.alias
    }

    Object.keys(orderBy).forEach(key => {
      const value = orderBy[key]

      query.addOrderBy(`${alias}.${key}`, value)
    })

    return query
  }

  private factoryIncludes(
    query: SelectQueryBuilder<TModel>,
    includes: IncludesContract[],
    alias?: string,
    isInternRequest?: boolean,
  ) {
    if (!alias) {
      alias = query.alias
    }

    includes.forEach(include => {
      if (!isInternRequest && !this.relations?.includes(include.relation)) {
        throw new Error(`According to ${this.Model.constructor.name} model, it is not possible to include ${include.relation}`)
      }

      const includeAlias = `${include.relation}`.toLocaleUpperCase()

      query.leftJoinAndSelect(`${alias}.${include.relation}`, includeAlias)

      this.factoryRequest(query, include, includeAlias)
    })

    return query
  }

  /**
   * Retrieves multiple data from Database
   *
   * @param pagination The pagination used to paginate data
   * @param options The options used to filter data
   * @return The paginated response with models retrieved
   */
  async getAll(pagination?: PaginationContract, options?: ApiRequestContract): Promise<PaginatedResponse<TModel>> {
    const Query = this.createQueryBuilder(this.Model)

    if (pagination) {
      Query.skip(pagination.page || 0)
      Query.take(pagination.limit || 10)
    }

    this.factoryRequest(Query, options)

    const returnData = await Query.getManyAndCount()

    const data = returnData[0]
    const total = returnData[1]

    return paginate(data, total, pagination || { page: 0, limit: 10 })
  }

  /**
   * Store one in database
   *
   * @param body The body that is going to be used to store
   * @return The model created with body information
   */
  async storeOne(body: any): Promise<TModel | any> {
    return this.save(this.create(body))
  }

  /**
   * Retrieves one data from Database
   *
   * @param id The id of the model
   * @param options The options used to filter data
   * @return The model founded or undefined
   */
  async getOne(id?: string | number | null, options?: ApiRequestContract): Promise<TModel | undefined> {
    const Query = this.createQueryBuilder()

    if (id) {
      Query.where({ id })
    }

    this.factoryRequest(Query, options)

    return Query.getOne()
  }

  /**
   * Update one from database
   *
   * @param id The id or model that is going to be updated
   * @param body The body that is going to be used to update
   * @return The model updated with body information
   * @throws Error if cannot find model with ID
   */
  async updateOne(id: string | number | any, body: any): Promise<TModel | any> {
    let model = id

    if (typeof id === 'string' || typeof id === 'number') {
      model = await this.getOne(id)
    }

    if (!model) {
      throw new Error('MODEL_NOT_FOUND_UPDATE')
    }

    Object.keys(body).forEach((key) => {
      model[key] = body[key]
    })

    return this.save(model)
  }

  /**
   * Delete one from database
   *
   * @param id The id or model that is going to be deleted
   * @param soft If is a soft delete or a true delete from database
   * @return The model soft deleted or void if deleted
   * @throws Error if cannot find model with ID
   */
  async deleteOne(id: string | number | any, soft = true): Promise<TModel | void> {
    let model = id

    if (typeof id === 'string' || typeof id === 'number') {
      model = await this.getOne(id)
    }

    if (!model) {
      throw new Error('MODEL_NOT_FOUND_DELETE')
    }

    if (model.deletedAt) {
      throw new Error('MODEL_IS_ALREADY_DELETED')
    }

    if (soft) {
      return this.updateOne(id, { deletedAt: new Date() })
    }

    await model.delete()
  }
}
