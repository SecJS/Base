export class BaseService<T extends Record<string, any>> {
  /**
   * Creates a new instance of the given entity
   *
   * @param create Properties of the instance to create.
   * @return The entity instance to be created
   */
  setDataCreate(create: any): T {
    const model: Record<string, any> = {}

    Object.entries(create).forEach(([key, value]) => {
      model[key] = value
    })

    return model as T
  }

  /**
   * Updates the given instance of the entity
   *
   * @param model The current instance
   * @param update Properties to apply as update.
   * @return The updated entity instance
   */
  setDataUpdate(model: T, update: any): T {
    Object.entries(update).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model[key] = value
    })

    return model
  }
}
