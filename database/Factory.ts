import * as faker from 'faker'

import { Seeder } from './Seeder'

export abstract class Factory<TModel> {
  protected faker = faker

  protected _count = 1
  protected _extraParams: any = {}

  protected abstract seeder: Seeder<TModel>
  protected abstract fakeBlueprint(): any
  protected abstract blueprint(): any | Promise<any>

  private async resolveBbp(blueprint: any, restart?: boolean) {
    let values = blueprint()
    const isAsync = blueprint[Symbol.toStringTag] === 'AsyncFunction'

    if (isAsync) values = await Promise.resolve(values)

    return this.concatParams(values, restart)
  }

  private restartProps() {
    this._count = 1
    this._extraParams = {}
  }

  private concatParams(values: any, restart = true) {
    const fullBlueprint = {
      ...values,
      ...this._extraParams,
    }

    if (restart) this.restartProps()

    return fullBlueprint
  }

  make(): Partial<TModel> | Partial<TModel[]> {
    if (this._count > 1) {
      const objects: any[] = []

      for (let i = 1; i <= this._count; i++) {
        objects.push(this.concatParams(this.fakeBlueprint(), false))
      }

      this.restartProps()

      return objects
    }

    return this.concatParams(this.fakeBlueprint())
  }

  async create(): Promise<TModel | TModel[]> {
    if (this._count > 1) {
      const promises = []

      for (let i = 1; i <= this._count; i++) {
        promises.push(
          this.seeder.seed(await this.resolveBbp(this.blueprint, false)),
        )
      }

      this.restartProps()

      return Promise.all(promises)
    }

    return this.seeder.seed(await this.resolveBbp(this.blueprint))
  }

  count(number = 1) {
    this._count = number

    return this
  }

  deleted() {
    this._extraParams.deletedAt = new Date()

    return this
  }

  extraParams(params: any) {
    this._extraParams = params

    return this
  }
}
