import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'styles.json')
    const styles = JSON.parse(readFileSync(filePath, 'utf-8'))
    return NextResponse.json(styles)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load styles' }, { status: 500 })
  }
}
