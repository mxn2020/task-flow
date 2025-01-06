// lib/upstash.ts

import { Redis } from '@upstash/redis'

// Type definitions
export interface Notification {
  userId: string
  title: string
  message: string
  scheduledFor: Date
  itemId?: string
  itemType?: string
  notificationType: string
  metadata?: Record<string, unknown>
}

interface NotificationWithKey extends Notification {
  key: string
}

// Configuration and constants
const REDIS_CONFIG = {
  SCHEDULE_SET: 'notifications:schedule',
  QUEUE_PREFIX: 'notifications:queue',
  USER_SETTINGS_PREFIX: 'user:settings',
  DEFAULT_BATCH_SIZE: 50,
  DEFAULT_TTL: 3600,  // 1 hour in seconds
  MAX_RETRIES: 3
} as const

// Redis client initialization with environment validation
function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing required Redis environment variables')
  }

  return new Redis({
    url,
    token,
    automaticDeserialization: true
  })
}

export const redis = createRedisClient()

/**
 * Queues a notification for future delivery.
 * 
 * @param notification - The notification object to be queued
 * @returns Promise<void>
 * @throws Error if the operation fails
 */
export async function queueNotification(notification: Notification): Promise<void> {
  const key = `${REDIS_CONFIG.QUEUE_PREFIX}:${notification.userId}:${Date.now()}`
  const score = notification.scheduledFor.getTime()

  try {
    // Use pipeline to ensure atomic operations
    const pipeline = redis.pipeline()
    pipeline.set(key, JSON.stringify(notification))
    pipeline.zadd(REDIS_CONFIG.SCHEDULE_SET, { score, member: key })
    await pipeline.exec()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to queue notification: ${error.message}`)
    } else {
      throw new Error('Failed to queue notification: Unknown error')
    }
  }
}

/**
 * Retrieves notifications scheduled between the specified time range.
 * 
 * @param fromTime - Start timestamp in milliseconds
 * @param toTime - End timestamp in milliseconds
 * @returns Promise<NotificationWithKey[]>
 */
export async function getScheduledNotifications(
  fromTime: number,
  toTime: number
): Promise<NotificationWithKey[]> {
  try {
    const keys = await redis.zrange(REDIS_CONFIG.SCHEDULE_SET, fromTime, toTime, {
      byScore: true
    })

    if (!keys.length) {
      return []
    }

    const notifications: NotificationWithKey[] = []
    // Process in batches for better performance
    for (let i = 0; i < keys.length; i += REDIS_CONFIG.DEFAULT_BATCH_SIZE) {
      const batch = keys.slice(i, i + REDIS_CONFIG.DEFAULT_BATCH_SIZE)
      const results = await Promise.all(
        batch.map(async (key) => {
          const data = await redis.get<string>(key as string)
          if (!data) return null
          try {
            const parsed = JSON.parse(data)
            return { key, ...parsed }
          } catch {
            await removeProcessedNotification(key as string)
            return null
          }
        })
      )
      notifications.push(...results.filter(Boolean) as NotificationWithKey[])
    }

    return notifications
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve scheduled notifications: ${error.message}`)
    } else {
      throw new Error('Failed to retrieve scheduled notifications: Unknown error')
    }
  }
}

/**
 * Removes a notification after it has been processed.
 * 
 * @param key - The Redis key of the notification
 * @returns Promise<void>
 */
export async function removeProcessedNotification(key: string): Promise<void> {
  try {
    const pipeline = redis.pipeline()
    pipeline.del(key)
    pipeline.zrem(REDIS_CONFIG.SCHEDULE_SET, key)
    await pipeline.exec()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove processed notification: ${error.message}`)
    } else {
      throw new Error('Failed to remove processed notification: Unknown error')
    }
  }
}

/**
 * Retrieves all pending notifications for a specific user.
 * 
 * @param userId - The user's unique identifier
 * @returns Promise<NotificationWithKey[]>
 */
export async function getUserPendingNotifications(
  userId: string
): Promise<NotificationWithKey[]> {
  try {
    const pattern = `${REDIS_CONFIG.QUEUE_PREFIX}:${userId}:*`
    const keys = await redis.keys(pattern)
    
    if (!keys.length) {
      return []
    }

    const notifications = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get<string>(key)
        if (!data) return null
        try {
          return { key, ...JSON.parse(data) }
        } catch {
          await removeProcessedNotification(key)
          return null
        }
      })
    )

    return notifications.filter(Boolean) as NotificationWithKey[]
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user notifications: ${error.message}`)
    } else {
      throw new Error('Failed to get user notifications: Unknown error')
    }
  }
}

/**
 * Updates an existing notification's scheduled time.
 * 
 * @param key - The Redis key of the notification
 * @param newScheduledTime - New Date object for rescheduling
 * @returns Promise<void>
 */
export async function rescheduleNotification(
  key: string,
  newScheduledTime: Date
): Promise<void> {
  try {
    const notification = await redis.get<string>(key)
    if (!notification) {
      throw new Error('Notification not found')
    }

    const parsed = JSON.parse(notification) as Notification
    parsed.scheduledFor = newScheduledTime

    const pipeline = redis.pipeline()
    pipeline.set(key, JSON.stringify(parsed))
    pipeline.zadd(REDIS_CONFIG.SCHEDULE_SET, { score: newScheduledTime.getTime(), member: key })
    await pipeline.exec()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reschedule notification: ${error.message}`)
    } else {
      throw new Error('Failed to reschedule notification: Unknown error')
    }
  }
}

/**
 * Bulk removes notifications for a given user.
 * 
 * @param userId - The user's unique identifier
 * @returns Promise<number> Number of notifications removed
 */
export async function clearUserNotifications(userId: string): Promise<number> {
  try {
    const pattern = `${REDIS_CONFIG.QUEUE_PREFIX}:${userId}:*`
    const keys = await redis.keys(pattern)
    
    if (keys.length === 0) {
      return 0
    }

    const pipeline = redis.pipeline()
    pipeline.del(...keys)
    pipeline.zrem(REDIS_CONFIG.SCHEDULE_SET, ...keys)
    await pipeline.exec()

    return keys.length
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to clear user notifications: ${error.message}`)
    } else {
      throw new Error('Failed to clear user notifications: Unknown error')
    }
  }
}

/**
 * Caches user settings with optional TTL.
 * 
 * @param userId - The user's unique identifier
 * @param settings - User settings object
 * @param ttl - Optional TTL in seconds (defaults to 1 hour)
 */
export async function cacheUserSettings<T extends Record<string, unknown>>(
  userId: string,
  settings: T,
  ttl: number = REDIS_CONFIG.DEFAULT_TTL
): Promise<void> {
  try {
    const key = `${REDIS_CONFIG.USER_SETTINGS_PREFIX}:${userId}`
    await redis.set(key, JSON.stringify(settings), { ex: ttl })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to cache user settings: ${error.message}`)
    } else {
      throw new Error('Failed to cache user settings: Unknown error')
    }
  }
}

/**
 * Retrieves cached user settings.
 * 
 * @param userId - The user's unique identifier
 * @returns Promise<T | null> User settings or null if not found
 */
export async function getCachedUserSettings<T extends Record<string, unknown>>(
  userId: string
): Promise<T | null> {
  try {
    const key = `${REDIS_CONFIG.USER_SETTINGS_PREFIX}:${userId}`
    const data = await redis.get<string>(key)
    
    if (!data) {
      return null
    }

    try {
      return JSON.parse(data) as T
    } catch {
      await redis.del(key) // Clean up invalid data
      return null
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get cached user settings: ${error.message}`)
    } else {
      throw new Error('Failed to get cached user settings: Unknown error')
    }
  }
}