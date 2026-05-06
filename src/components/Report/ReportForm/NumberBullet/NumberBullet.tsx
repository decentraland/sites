import type { NumberBulletProps } from './NumberBullet.types'
import { BulletCircle } from './NumberBullet.styled'

function NumberBullet({ number }: NumberBulletProps) {
  return <BulletCircle>{number}</BulletCircle>
}

export { NumberBullet }
