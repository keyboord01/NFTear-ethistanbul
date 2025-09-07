import { NextRequest } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {}

export async function GET(_req: NextRequest) {
  try {
    const filePath = join(process.cwd(), 'lib', 'bytecodehex.txt')
    const data = await readFile(filePath, 'utf8')
    const body = data.trim().startsWith('0x') ? data.trim() : `0x${data.trim()}`
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() },
    })
  } catch (e: any) {
    return new Response(`Failed to read bytecode: ${e?.message || 'unknown error'}`, { status: 500, headers: corsHeaders() })
  }
}


