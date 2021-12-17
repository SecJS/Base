import { ApiRequestContract } from '@secjs/contracts'

export abstract class Seeder<TModel> {
  protected abstract repository: any

  async isDeleted(id?: string, options?: ApiRequestContract) {
    const model = await this.repository.getOne(id, options)

    return !!model
  }

  async isSoftDeleted(id?: string, options?: ApiRequestContract) {
    const model = await this.repository.getOne(id, options)

    if (!model) return false

    return !!model.deletedAt
  }

  async seed(params: any): Promise<TModel> {
    return this.repository.storeOne(params)
  }

  async seedMany(number: number, params: any): Promise<TModel[]> {
    const promises = []

    for (let i = 1; i <= number; i++) {
      promises.push(this.repository.storeOne(params))
    }

    return Promise.all(promises)
  }
}
