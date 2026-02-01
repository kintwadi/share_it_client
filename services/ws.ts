import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { API_BASE } from './mockApi'
import { Message } from '../types'

let client: Client | null = null
let connected = false
const pendingSubs: Array<{ dest: string, handler: (payload: any) => void }> = []

export function connectWs(baseUrl: string = API_BASE, token?: string) {
  if (client && connected) return client
  client = new Client({
    webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
    reconnectDelay: 5000,
    debug: () => {}
  })
  client.onConnect = () => {
    connected = true
    // flush pending subscriptions
    pendingSubs.splice(0).forEach(({ dest, handler }) => {
      client!.subscribe(dest, (frame) => {
        try {
          const body = JSON.parse(frame.body)
          if (dest.startsWith('/topic/messages.')) {
            const msg: Message = {
              id: String(body.id), senderId: String(body.senderId), receiverId: String(body.receiverId), content: body.content, imageUrl: body.imageUrl ? String(body.imageUrl) : undefined, timestamp: body.timestamp, isRead: !!body.isRead,
            }
            handler(msg)
          } else {
            handler(body)
          }
        } catch {}
      })
    })
  }
  client.onDisconnect = () => {
    connected = false
  }
  client.activate()
  return client
}

export function subscribeUser(userId: string, handler: (m: Message) => void) {
  const dest = `/topic/messages.${userId}`
  if (!client || !connected) {
    pendingSubs.push({ dest, handler })
    return
  }
  client.subscribe(dest, (frame) => {
    try {
      const body = JSON.parse(frame.body)
      const msg: Message = {
        id: String(body.id), senderId: String(body.senderId), receiverId: String(body.receiverId), content: body.content, imageUrl: body.imageUrl ? String(body.imageUrl) : undefined, timestamp: body.timestamp, isRead: !!body.isRead,
      }
      handler(msg)
    } catch {}
  })
}

export function sendMessage(senderId: string, receiverId: string, content: string, imageUrl?: string) {
  if (!client || !connected) throw new Error('ws_not_connected')
  client.publish({ destination: '/app/chat.send', body: JSON.stringify({ senderId, receiverId, content, imageUrl }) })
}

export function subscribePresence(handler: (update: { userId: string, online: boolean }) => void) {
  const dest = `/topic/presence`
  if (!client || !connected) {
    pendingSubs.push({ dest, handler })
    return
  }
  client.subscribe(dest, (frame) => {
    try {
      const body = JSON.parse(frame.body)
      handler({ userId: String(body.userId), online: !!body.online })
    } catch {}
  })
}

export function announceOnline(userId: string) {
  if (!client || !connected) return
  client.publish({ destination: '/app/presence.online', body: userId })
}