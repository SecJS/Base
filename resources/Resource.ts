export function Resource<JsonResource>() {
  return class Resource {
    static blueprint(model: any) {
      return model
    }

    static toJson(model: any): JsonResource {
      if (!model) return null

      const blueprint = this.blueprint(model)

      Object.keys(blueprint).forEach(key => {
        if (!blueprint[key]) delete blueprint[key]
      })

      return JSON.parse(JSON.stringify(blueprint))
    }

    static toArray(models: any[]): JsonResource[] {
      if (!models) return null

      return models.map(model => this.toJson(model))
    }
  }
}
