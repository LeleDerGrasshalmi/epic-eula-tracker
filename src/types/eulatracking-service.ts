export interface Eula {
  id: string
  key: string
  version: number
  revision: number
  title: string
  body: string
  locale: string
  createdTimestamp: string
  lastModifiedTimestamp: string
  status: string
  description?: string
  custom: boolean
  url: string
  bodyFormat: string
}
