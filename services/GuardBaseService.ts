import { BaseService } from './BaseService'

interface IGuard {
  id?: string | number
  status?: string
  deletedAt?: string | Date
  user?: any
}

export class GuardBaseService<T extends IGuard> extends BaseService<T> {
  private _guard: T | undefined

  /**
   * Retrieves guard or throw exception
   *
   * @throws throws exception if there is any guard set
   * @return The guard property with user information
   */
  get guard(): T {
    if (!this._guard) {
      throw new Error('GUARD_UNSET')
    }

    return this._guard
  }

  /**
   * Set the guard of all service methods
   *
   * @param guard The guardian that is going to be set
   * @return The GuardBaseService property to execute other methods
   */
  setGuard(guard: T) {
    this._guard = guard

    if (guard.id) {
      this._guard.user = guard
    }

    return this
  }
}
