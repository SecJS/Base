/* eslint-disable prefer-rest-params,@typescript-eslint/ban-types */

interface IOptions {
  parameterIndex?: number
}

export const Options = (options?: IOptions): MethodDecorator => {
  return (
    target,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    if (!options) {
      options = {}
      options.parameterIndex = 1
    }

    const originalFunction: Function = descriptor.value

    descriptor.value = async function () {
      const newArgs = [...arguments]

      newArgs[options.parameterIndex] = arguments[options.parameterIndex] || {
        where: {},
        orderBy: {},
        includes: [],
        otherQueries: {},
      }

      return originalFunction.apply(this, newArgs)
    }

    return descriptor
  }
}
