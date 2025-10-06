'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Conversation {
  listingId: string
  listing: {
    id: string
    title: string
    price: number
    images: string[]
    userId: string
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
    sender: {
      name: string
      email: string
    }
  }
  unreadCount: number
  messages: Array<{
    id: string
    content: string
    createdAt: string
    senderId: string
    read: boolean
    sender: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchConversations()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    const listingId = searchParams?.get('listingId')
    if (listingId && conversations.length > 0) {
      const conversation = conversations.find(c => c.listingId === listingId)
      if (conversation) {
        selectConversation(conversation)
      }
    }
  }, [searchParams, conversations])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessages(conversation.messages)

    // Mark messages as read
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId: conversation.listingId }),
      })

      // Update unread count locally
      setConversations(prev => prev.map(c =>
        c.listingId === conversation.listingId
          ? { ...c, unreadCount: 0 }
          : c
      ))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !newMessage.trim()) return

    setSending(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: selectedConversation.listingId,
          content: newMessage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const sentMessage = await response.json()

      // Add to local messages
      setMessages(prev => [...prev, sentMessage])
      setNewMessage('')

      // Update conversation's last message
      setConversations(prev => prev.map(c =>
        c.listingId === selectedConversation.listingId
          ? { ...c, lastMessage: sentMessage }
          : c
      ))

    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Authentication check
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view messages</h1>
          <p className="text-gray-600 mb-6">
            Access your conversations with buyers and sellers.
          </p>
          <a
            href="/auth/signin"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Messages
          </h1>
          <p className="text-lg text-gray-600">
            Your conversations with buyers and sellers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">

            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading conversations...</p>
                  </div>
                )}

                {!loading && conversations.length === 0 && (
                  <div className="p-4 text-center">
                    <p className="text-gray-600">No conversations yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Start browsing cars to begin conversations with sellers.
                    </p>
                  </div>
                )}

                {conversations.map((conversation) => (
                  <button
                    key={conversation.listingId}
                    onClick={() => selectConversation(conversation)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedConversation?.listingId === conversation.listingId ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Car Image */}
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {conversation.listing.images && conversation.listing.images.length > 0 ? (
                          <img
                            src={conversation.listing.images[0]}
                            alt="Car"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.listing.title}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.sender.name}: {conversation.lastMessage.content}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedConversation.listing.title}</h3>
                        <p className="text-sm text-gray-600">€{selectedConversation.listing.price.toLocaleString()}</p>
                      </div>
                      <a
                        href={`/listings/${selectedConversation.listingId}`}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View Listing
                      </a>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender.email === session?.user?.email
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          newMessage.trim() && !sending
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {sending ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a conversation from the sidebar to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}