import { createAvatar } from '@dicebear/core'
import { adventurerNeutral } from '@dicebear/collection'

export function generateAvatar(seed: string): string {
  const avatar = createAvatar(adventurerNeutral, {
    seed: seed,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['solid'],
    size: 40,
  })

  return avatar.toDataUri()
}

export function generateAvatarUrl(seed: string): string {
  const avatar = createAvatar(adventurerNeutral, {
    seed: seed,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['solid'],
    size: 40,
  })

  return avatar.toString()
}
