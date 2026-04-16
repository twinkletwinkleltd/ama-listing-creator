import AppClient from './components/AppClient'
import { getAllListings, getAllStyles } from '@/lib/listingStore'

// Render on every request so newly saved styles appear without restart
export const dynamic = 'force-dynamic'

export default function Home() {
  const listings = getAllListings()
  const styles = getAllStyles()
  return <AppClient listings={listings} styles={styles} />
}
