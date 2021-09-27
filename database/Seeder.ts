export abstract class Seeder<TModel> {
  protected abstract repository: any

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
