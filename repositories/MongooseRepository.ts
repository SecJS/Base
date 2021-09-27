import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@secjs/exceptions'

import {
  ApiRequestContract,
  IncludesContract,
  OrderByContract,
  WhereContract,
  PaginationContract,
  PaginatedResponse,
} from '@secjs/contracts'

import { paginate } from '@secjs/utils'
import { Model, Document, isValidObjectId } from 'mongoose'

export abstract class MongooseRepository<TModel extends Document> {
  model: Model<TModel> | any

  wheres: string[]
  relations: string[]

  private factoryRequest(query: any, options?: ApiRequestContract) {
    if (!options) {
      return
    }

    const { where, orderBy, includes, isInternRequest = true } = options

    if (where) {
      this.factoryWhere(query, where, isInternRequest)
    }

    if (orderBy) {
      this.factoryOrderBy(query, orderBy)
    }

    if (includes) {
      this.factoryIncludes(query, includes, isInternRequest)
    }
  }

  private factoryWhere(
    query: any,
    where: WhereContract,
    isInternRequest: boolean,
  ) {
    Object.keys(where).forEach(key => {
      const value: any = where[key]

      if (!isInternRequest && !this.wheres?.includes(key)) {
        throw new UnprocessableEntityException(
          `It is not possible to filter by ${key}`,
        )
      }

      if (Array.isArray(value)) {
        query.where(key, { $in: value })

        return
      }

      if (typeof value === 'string' && value.includes(',')) {
        if (value.startsWith('!')) {
          query.where(key, {
            $nin: value
              .split(',')
              .map(v => v.replace(/\s/g, '').replace('!', '')),
          })

          return
        }

        query.where(key, {
          $in: value.split(',').map(v => v.replace(/\s/g, '')),
        })

        return
      }

      if (typeof value === 'string' && value.includes('->')) {
        const firstValue = value.split('->')[0].replace(/\s/g, '')
        const secondValue = value.split('->')[1].replace(/\s/g, '')

        query.where(key, { $gte: firstValue, $lte: secondValue })

        return
      }

      if (typeof value === 'string' && value.includes('%')) {
        value.replace('%', '')

        query.where(key, { $regex: value, $options: 'i' })

        return
      }

      if (value === 'null') {
        query.where(key, null)

        return
      }

      if (value === '!null') {
        query.where(key, { $ne: null })

        return
      }

      query.where(key, value)
    })
  }

  private factoryOrderBy(query: any, orderBy: OrderByContract) {
    Object.keys(orderBy).forEach(key => {
      query.sort(key, orderBy[key].toUpperCase())
    })
  }

  private factoryIncludes(
    query: any,
    includes: IncludesContract[],
    isInternRequest: boolean,
  ) {
    includes.forEach(include => {
      if (!isInternRequest && !this.relations?.includes(include.relation)) {
        throw new UnprocessableEntityException(
          `It is not possible to include ${include.relation} relation`,
        )
      }

      query.populate(include.relation)
    })
  }

  private factoryQuery(options?: ApiRequestContract) {
    const query = this.model.find()

    this.factoryRequest(query, options)

    return query
  }

  /**
   * Retrieves one data from Database
   *
   * @param id The id of the model
   * @param options The options used to filter data
   * @return The model founded or null
   * @throws UnprocessableEntityException when id is not a valid ObjectId
   */
  async getOne(
    id?: string,
    options?: ApiRequestContract,
  ): Promise<TModel | null> {
    const query = this.model.findOne()

    if (id) {
      if (!isValidObjectId(id)) {
        throw new UnprocessableEntityException('NOT_VALID_OBJECT_ID')
      }

      query.where('_id', id)
    }

    this.factoryRequest(query, options)

    return query.exec()
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
    const queryItems = this.factoryQuery(options)
    const queryCount = this.factoryQuery(options)

    if (pagination) {
      queryItems.skip(pagination.page || 0).limit(pagination.limit || 10)

      return paginate(
        await queryItems.exec(),
        await queryCount.countDocuments(),
        {
          page: pagination.page || 0,
          limit: pagination.limit || 10,
          resourceUrl: pagination.resourceUrl,
        },
      )
    }

    return {
      data: await queryItems.exec(),
      total: await queryCount.countDocuments(),
    }
  }

  /**
   * Store one in database
   *
   * @param body The body that is going to be used to create
   * @return The model created with body information
   */
  async storeOne(body: any): Promise<TModel> {
    return new this.model(body).save()
  }

  /**
   * Update one from database
   *
   * @param id The id or model that is going to be updated
   * @param body The body that is going to be used to update
   * @return The model updated with body information
   * @throws NotFoundException if cannot find model with ID
   */
  async updateOne(id: any, body: any): Promise<TModel> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new NotFoundException(
          'The model id has not been found to update.',
        )
      }
    }

    Object.keys(body).forEach(key => {
      model[key] = body[key]
    })

    return model.save()
  }

  /**
   * Update the other side of the relation
   *
   * @param id The id or model that is going to be updated
   * @param relationId The id of the relation that needs to be pushed to the array
   * @param relationName The name of the relation inside the main model file
   * @return The model updated with body information
   * @throws NotFoundException if cannot find model with ID
   */
  async updateOneToMany(
    id: any,
    relationId: string | number,
    relationName: string,
  ): Promise<TModel> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new NotFoundException(
          'The model id has not been found to update.',
        )
      }
    }

    model[relationName].push(relationId)

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
  async deleteOne(id: any, soft = true): Promise<TModel | void> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new NotFoundException(
          'The model id has not been found to delete.',
        )
      }
    }

    if (soft) {
      if (model.deletedAt) {
        throw new BadRequestException('The model id has been already deleted.')
      }

      model.deletedAt = new Date()

      return model.save()
    }

    await model.deleteOne()
  }
}
