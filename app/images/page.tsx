import ImagesClient from '../components/ImagesClient'
import fs from 'fs'
import path from 'path'

export default function ImagesPage() {
  const dataDir = path.join(process.cwd(), 'data')
  let listings: unknown[] = []
  try {
    listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'))
  } catch { /* ignore */ }
  return <ImagesClient listings={listings as any[]} />
}
