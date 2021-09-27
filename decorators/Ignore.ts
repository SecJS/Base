// Annotate your class with @Ignore and ApplicationProvider will not read it.

interface IOptions {
  onlyFromImports?: boolean
}

export function Ignore(options?: IOptions): ClassDecorator {
  return target => {
    if (options?.onlyFromImports) {
      target.prototype.ignore = false
      target.prototype.onlyFromImports = options.onlyFromImports

      return
    }

    target.prototype.ignore = true
  }
}
