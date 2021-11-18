# Base 📐

> Base stuffs for any NodeJS project

[![GitHub followers](https://img.shields.io/github/followers/jlenon7.svg?style=social&label=Follow&maxAge=2592000)](https://github.com/jlenon7?tab=followers)
[![GitHub stars](https://img.shields.io/github/stars/secjs/base.svg?style=social&label=Star&maxAge=2592000)](https://github.com/secjs/base/stargazers/)

<p>
    <a href="https://www.buymeacoffee.com/secjs" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</p>

<p>
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/secjs/base?style=for-the-badge&logo=appveyor">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/secjs/base?style=for-the-badge&logo=appveyor">

  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=appveyor">

  <img alt="Commitizen" src="https://img.shields.io/badge/commitizen-friendly-brightgreen?style=for-the-badge&logo=appveyor">
</p>

The intention behind this repository is to always maintain a `Base` project to any NodeJS project.

<img src=".github/base.png" width="200px" align="right" hspace="30px" vspace="100px">

## Installation

> To use the high potential from this package you need to install first this other packages from SecJS, 
> it keeps as dev dependency because one day `@secjs/core` will install everything once.

```bash
npm install @secjs/contracts @secjs/exceptions @secjs/utils
```

> Then you can install the package using:

```bash
npm install @secjs/base
```

### BaseService

> Use to get nice methods to use with @secjs/base repositories

```ts
import { User } from 'app/Models/User'
import { NotFoundException } from '@nestjs/common'
import { BaseService } from '@secjs/base/services/BaseService'
import { ContactResource } from 'app/Resources/ContactResource'
import { ContactRepository } from 'app/Repositories/ContactRepository'

class ContactService extends BaseService<User> {
  protected resourceName = 'contact'
  protected resource = new ContactResource()
  protected repository = new ContactRepository()
  protected NotFoundException: any = NotFoundException // Define exception or use NotFoundException default from @secjs/exceptions

  // You can subscribe BaseService methods in here if you want!
}
```

---

### LucidRepository

> Use LucidRepository to get nice methods based on ApiRequestContract

```ts
import { User } from 'app/Models/User'
import { LucidRepository } from '@secjs/base/repositories/LucidRepository'

class UserRepository extends LucidRepository<User> {
  model = User // Give the Model value to Lucid, so he knows what to work with.

  wheres = ['id', 'name'] // What wheres can be executed by client
  relations = ['contacts'] // What relations can be get by client

  // Both, wheres and relations will only work for external requests.
  
  // You can subscribe LucidRepository methods in here if you want!  
}
```

---

### TypeOrmRepository

> Use TypeOrmRepository to get nice methods based on ApiRequestContract

```ts
import { User } from 'app/Models/User'
import { TypeOrmRepository } from '@secjs/base/repositories/TypeOrmRepository'

class UserRepository extends TypeOrmRepository<User> {
  model = User // Give the Model value to Lucid, so he knows what to work with.
  
  wheres = ['id', 'name'] // What wheres can be executed by client
  relations = ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.
  
  // You can subscribe TypeOrmRepository methods in here if you want!
}
```

---

### MongooseRepository

> Use MongooseRepository to get nice methods based on ApiRequestContract

```ts
import { User, UserDocument } from 'app/Schemas/User'
import { MongooseRepository } from '@secjs/base/repositories/MongooseRepository'

class UserRepository extends MongooseRepository<UserDocument> {
  model = User // Give the Model value to Mongoose, so he knows what to work with.

  wheres = ['id', 'name'] // What wheres can be executed by client
  relations = ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.

  // You can subscribe MongooseRepository methods in here if you want!  
}
```

---

### PrismaRepository

> Use PrismaRepository to get nice methods based on ApiRequestContract

```ts
import { User } from 'app/Models/User'
import { PrismaRepository } from '@secjs/base/repositories/PrismaRepository'

class UserRepository extends PrismaRepository<User> {
  model = User // Give the Model value to Lucid, so he knows what to work with.

  wheres = ['id', 'name'] // What wheres can be executed by client
  relations = ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.

  // You can subscribe PrismaRepository methods in here if you want!
}
```

---

## License

Made with 🖤 by [jlenon7](https://github.com/jlenon7) :wave:
