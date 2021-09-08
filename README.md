# Base 📐

> Base stuffs for any NodeJS project

[![GitHub followers](https://img.shields.io/github/followers/jlenon7.svg?style=social&label=Follow&maxAge=2592000)](https://github.com/jlenon7?tab=followers)
[![GitHub stars](https://img.shields.io/github/stars/secjs/base.svg?style=social&label=Star&maxAge=2592000)](https://github.com/secjs/base/stargazers/)

<p>
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/secjs/base?style=for-the-badge&logo=appveyor">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/secjs/base?style=for-the-badge&logo=appveyor">

  <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge&logo=appveyor">
</p>

The intention behind this repository is to always maintain a `Base` project to any NodeJS project.

<img src=".github/base.jpg" width="200px" align="right" hspace="30px" vspace="100px">

## Installation

```bash
npm install @secjs/base
```

### GuardBaseService

```ts
import { User } from 'app/Models/User'
import { GuardBaseService } from '@secjs/base/services/GuardBaseService'

class ContactService extends GuardBaseService<User> { 
  // You need to write all you methods in here, GuardBaseService
  // just makes sure it's an authenticated request and save the
  // Guard/User in the context of the service.
  
  // Use like this -> new ContactService.setGuard(your/guard).getOne(1)
  async getOne(id) {
    const contact = // ... all the logic to get an Contact

    // If you use User as guard, you can access this.guard.user.id or this.guard.id
    if (contact.user_id !== this.guard.user.id) {
      throw new Error('Unauthorized')
    }

    return contact
  }
}
```

---

### LucidRepository

> Use LucidRepository to get nice methods based on ApiRequestContract

```ts
import { User } from 'app/Models/User'
import { LucidRepository } from '@secjs/base/repositories/LucidRepository'

class UserRepository extends LucidRepository<User> {
  protected wheres: ['id', 'name'] // What wheres can be executed by client
  protected relations: ['contacts'] // What relations can be get by client

  // Both, wheres and relations will only work for external requests.

  protected Model = User // Give the Model value to Lucid, so he knows what to work with.
  
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
  protected wheres: ['id', 'name'] // What wheres can be executed by client
  protected relations: ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.

  protected Model = User // Give the Model value to Lucid, so he knows what to work with.

  // You can subscribe TypeOrmRepository methods in here if you want!
}
```

---

### MongooseRepository

> Use MongooseRepository to get nice methods based on ApiRequestContract

```ts
import { User } from 'app/Models/User'
import { MongooseRepository } from '@secjs/base/repositories/MongooseRepository'

class UserRepository extends MongooseRepository<User> {
  protected wheres: ['id', 'name'] // What wheres can be executed by client
  protected relations: ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.

  protected Model = User // Give the Model value to Mongoose, so he knows what to work with.

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
  protected wheres: ['id', 'name'] // What wheres can be executed by client
  protected relations: ['contacts'] // What relations can be get by client
  
  // Both, wheres and relations will only work for external requests.

  protected Model = User // Give the Model value to Lucid, so he knows what to work with.

  // You can subscribe PrismaRepository methods in here if you want!
}
```

---

## License

Made with 🖤 by [jlenon7](https://github.com/jlenon7) :wave:
