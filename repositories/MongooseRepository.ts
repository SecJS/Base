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
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@secjs/exceptions'

export abstract class MongooseRepository<TModel extends Document> {
  protected abstract Model: Model<TModel>

  private factoryRequest(query: any, options?: ApiRequestContract) {
    if (!options) {
      return
    }

    const { where, orderBy, includes } = options

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
      let value: any = where[key]

      if (Array.isArray(value)) {
        value = { $in: value }
      }

      if (typeof value === 'string' && value.includes('->')) {
        const firstValue = value.split('->')[0].replace(/\s/g, '')
        const secondValue = value.split('->')[1].replace(/\s/g, '')

        value = { $gte: firstValue, $lte: secondValue }
      }

      if (value === 'null') value = null
      if (value === '!null') value = { $ne: null }

      query.where(key, value)
    })
  }

  private factoryOrderBy(query: any, orderBy: OrderByContract) {
    Object.keys(orderBy).forEach(key => {
      query.sort(key, orderBy[key].toUpperCase())
    })
  }

  private factoryIncludes(query: any, includes: IncludesContract[]) {
    includes.forEach(include => {
      query.populate(include.relation)
    })
  }

  private factoryQuery(options?: ApiRequestContract) {
    const query = this.Model.find()

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
    const query = this.Model.findOne()

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
    return new this.Model(body).save()
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
        throw new NotFoundException('The model id has not been found to update.')
      }
    }

    Object.keys(body).forEach(key => {
      model[key] = body[key]
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
  async deleteOne(id: any, soft = true): Promise<TModel | void> {
    let model = id

    if (typeof id === 'string') {
      model = await this.getOne(id)

      if (!model) {
        throw new NotFoundException('The model id has not been found to delete.')
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
