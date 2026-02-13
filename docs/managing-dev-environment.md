# Managing Your Dev Environment

### Prisma

- Open Prisma Studio (database GUI)
  ```shell
  pnpm prisma studio
  ```

- Reset database
  ```shell
  pnpm prisma migrate reset
  ```

- Push schema changes without migration
  ```shell
  pnpm prisma db push
  ````

- [Prisma Query Docs](https://www.prisma.io/nextjs)

### Docker-PostgreSQL

- Start PostgreSQL
  ```shell
  docker-compose up -d
  ```

- Stop PostgreSQL
  ```shell
  docker-compose down
  ```

- View logs
  ```shell
  docker-compose logs -f postgres
  ```

### pnpm Commands

- Run dev server
  ```shell
  pnpm dev
  ```

- Build for production
  ```shell
  pnpm build
  ```

- Start production server
  ```shell
  pnpm start
  ```

- Lint code
  ```shell
  pnpm lint
  ```

### Cloudinary

[Cloudinary Docs](https://cloudinary.com/documentation/transformation_reference)

**Client-side project uploads** use **signed** uploads: the browser uploads directly to Cloudinary (so the "Uploading..." progress bar reflects real upload progress), and the server issues a one-time signature so only authorized admins can upload. Only `CLOUDINARY_URL` is required; no upload preset is needed.

Cloudinary (Free Tier Limit) Details:
- Maximum image file size: 10 MB
- Maximum video file size: 100 MB
- Maximum online image manipulation size: 100 MB
- Maximum raw file size: 10 MB
- Maximum image megapixels: 25 MP
- Maximum total number of megapixels in all frames: 50 MP