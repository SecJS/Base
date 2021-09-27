/* eslint-disable new-cap */

import { Options } from '../decorators/Options'
import { NotFoundException } from '@secjs/exceptions'
import { ApiRequestContract, PaginationContract } from '@secjs/contracts'

export abstract class BaseService<TModel> {
  protected abstract resource: any
  protected abstract repository: any

  protected resourceName = 'model'
  protected NotFoundException: any = NotFoundException

  private getResourceName() {
    let name = ''

    if (this.repository.model?.constructor?.name) {
      name = this.repository.model.constructor.name.toUpperCase()
    }

    if (!name || name === 'OBJECT') name = this.resourceName

    return name
  }

  /**
   * Find one model based on options and id but returns the ORM instance
   *
   * @param id The id that needs to be fetched
   * @param options Properties to make the request based on ApiRequestContract
   * @return The model from ORM instance
   * @throws NotFoundException When can't find the model.
   * @throws UnprocessableEntityException When trying to filter or include something outside the where/include array.
   */
  @Options()
  async findOneInstance(id: string, options?: ApiRequestContract) {
    const model = await this.repository.getOne(id, options)

    if (!model) {
      throw new this.NotFoundException(
        `NOT_FOUND_${this.getResourceName().toUpperCase()}`,
      )
    }

    return model
  }

  /**
   * Find all models based on options and paginate it based on paginate
   *
   * @param paginate Properties to make the pagination based on PaginationContract
   * @param options Properties to make the request based on ApiRequestContract
   * @return The model json resource in array
   * @throws UnprocessableEntityException When trying to filter or include something outside the where/include array.
   */
  @Options()
  async findAll(paginate: PaginationContract, options?: ApiRequestContract) {
    const { data, meta, links }: any = await this.repository.getAll(
      paginate,
      options,
    )

    return {
      meta,
      links,
      data: this.resource.toArray(data),
    }
  }

  /**
   * Find one model based on options and id
   *
   * @param id The id that needs to be fetched
   * @param options Properties to make the request based on ApiRequestContract
   * @return The model json resource in object
   * @throws NotFoundException When can't find the model.
   * @throws UnprocessableEntityException When trying to filter or include something outside the where/include array.
   */
  @Options()
  async findOne(id: string, options?: ApiRequestContract) {
    const model = await this.findOneInstance(id, options)

    return this.resource.toJson(model)
  }

  /**
   * Create one model based on dto
   *
   * @param dto The dto that is going to be used to create the model
   * @return The model json resource in object
   */
  async createOne(dto: any) {
    const model = await this.repository.storeOne(dto)

    return this.resource.toJson(model)
  }

  /**
   * Update one model based on id or dto
   *
   * @param id The id that needs to be fetched
   * @param dto The dto that is going to be used to update the model
   * @return The model json resource in object
   * @throws NotFoundException When can't find the model.
   */
  async updateOne(id: string, dto: any) {
    const model = await this.repository.updateOne(
      await this.findOneInstance(id),
      dto,
    )

    return this.resource.toJson(model)
  }

  /**
   * Update one model based on id or dto
   *
   * @param id The id that needs to be fetched
   * @param soft If is a soft or a hard deletion from database
   * @return The model json resource in object or void
   * @throws NotFoundException When can't find the model.
   */
  async deleteOne(id: string, soft = true) {
    const model = await this.repository.deleteOne(
      await this.findOneInstance(id),
      soft,
    )

    return this.resource.toJson(model)
  }

  /**
   * Creates a new instance of the given entity
   *
   * @param create Properties of the instance to create.
   * @return The entity instance to be created
   */
  setDataCreate(create: any): TModel {
    const model: Record<string, any> = {}

    Object.entries(create).forEach(([key, value]) => {
      model[key] = value
    })

    return model as TModel
  }

  /**
   * Updates the given instance of the entity
   *
   * @param model The current instance
   * @param update Properties to apply as update.
   * @return The updated entity instance
   */
  setDataUpdate(model: TModel, update: any): TModel {
    Object.entries(update).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model[key] = value
    })

    return model
  }
}
