/* eslint-disable prefer-rest-params */

export const ExtraParams = (argument = 1): MethodDecorator => {
  return (
    target,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const originalFunction = descriptor.value

    descriptor.value = function () {
      const newArgs = [...arguments]

      newArgs[argument - 1] = arguments[argument - 1] || {}

      return originalFunction.apply(this, newArgs)
    }

    return descriptor
  }
}
