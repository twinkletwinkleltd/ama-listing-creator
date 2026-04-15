import fs from 'fs'
import path from 'path'
import AppClient from './components/AppClient'

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let styles: any[] = []
  try {
    const dataDir = path.join(process.cwd(), 'data')
    listings = JSON.parse(fs.readFileSync(path.join(dataDir, 'listings.json'), 'utf-8'))
    styles   = JSON.parse(fs.readFileSync(path.join(dataDir, 'styles.json'),   'utf-8'))
  } catch (e) {
    console.error('Failed to load data:', e)
  }
  return <AppClient listings={listings} styles={styles} />
}
