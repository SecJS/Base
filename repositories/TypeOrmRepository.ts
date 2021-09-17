import {
  ApiRequestContract,
  IncludesContract,
  OrderByContract,
  WhereContract,
  PaginationContract,
  PaginatedResponse,
} from '@secjs/contracts'

import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@secjs/exceptions'

import { Parser, paginate, Token } from '@secjs/utils'
import { Repository, SelectQueryBuilder } from 'typeorm'

export abstract class TypeOrmRepository<TModel> extends Repository<TModel> {
  protected abstract Model: any
  protected abstract wheres: any[]
  protected abstract relations: any[]

  private factoryRequest(
    Query: SelectQueryBuilder<TModel>,
    options?: ApiRequestContract,
    alias?: string,
  ) {
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
        throw new UnprocessableEntityException(
          `It is not possible to filter by ${key}`,
        )
      }

      if (!value) throw new Error('Where cannot be null, use null as string.')

      if (value === 'null') {
        query.andWhere(`${alias}.${key} IS NULL`)

        return
      }

      if (value === '!null') {
        query.andWhere(`${alias}.${key} IS NOT NULL`)

        return
      }

      if (typeof value === 'string' && value.includes('%')) {
        value.replace('%', '')

        query.andWhere(`${alias}.${key} like :${key}`, {
          [key]: `%${value}%`,
        })

        return
      }

      if (Array.isArray(value)) {
        query.andWhere(`${alias}.${key} ::jsonb @> :${key}`, {
          [key]: JSON.stringify(value),
        })

        return
      }

      const valueInString = value.toString()

      if (valueInString.includes(',')) {
        if (valueInString.includes('!')) {
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
      const value: any = orderBy[key]

      query.addOrderBy(`${alias}.${key}`, value.toUpperCase())
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
        throw new UnprocessableEntityException(
          `It is not possible to include ${include.relation} relation`,
        )
      }

      const includeAlias = `${
        include.relation
      }-${new Token().generate()}`.toLocaleUpperCase()

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
   * @throws UnprocessableEntityException When trying to filter or include something outside the where/include array.
   */
  async getAll(
    pagination?: PaginationContract,
    options?: ApiRequestContract,
  ): Promise<PaginatedResponse<TModel> | { data: TModel[]; total: number }> {
    const Query = this.createQueryBuilder(this.Model.name)

    this.factoryRequest(Query, options)

    if (pagination) {
      Query.skip(pagination.page || 0)
      Query.take(pagination.limit || 10)

      const returnData = await Query.getManyAndCount()

      return paginate(returnData[0], returnData[1], {
        page: pagination.page || 0,
        limit: pagination.limit || 10,
        resourceUrl: pagination.resourceUrl,
      })
    }

    const returnData = await Query.getManyAndCount()

    return {
      total: returnData[1],
      data: returnData[0],
    }
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
   * @throws UnprocessableEntityException When trying to filter or include something outside the where/include array.
   */
  async getOne(
    id?: string | number | null,
    options?: ApiRequestContract,
  ): Promise<TModel | undefined> {
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
   * @throws NotFoundException if cannot find model with ID
   */
  async updateOne(id: string | number | any, body: any): Promise<TModel | any> {
    let model = id

    if (typeof id === 'string' || typeof id === 'number') {
      model = await this.getOne(id)
    }

    if (!model) {
      throw new NotFoundException('The model id has not been found to update.')
    }

    Object.keys(body).forEach(key => {
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
   * @throws NotFoundException if cannot find model with ID
   * @throws BadRequestException if model is already deleted
   */
  async deleteOne(
    id: string | number | any,
    soft = true,
  ): Promise<TModel | void> {
    let model = id

    if (typeof id === 'string' || typeof id === 'number') {
      model = await this.getOne(id)
    }

    if (!model) {
      throw new NotFoundException('The model id has not been found to delete.')
    }

    if (soft) {
      if (model.deletedAt) {
        throw new BadRequestException('The model id has been already deleted.')
      }

      return this.updateOne(id, { deletedAt: new Date() })
    }

    await model.delete()
  }
}
