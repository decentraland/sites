import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import {
  LockIconBox,
  PrivateMessageContainer,
  PrivateMessageContent,
  PrivateMessageText,
  PrivateMessageTitle
} from './PrivateMessage.styled'

function PrivateMessage() {
  const t = useFormatMessage()
  return (
    <PrivateMessageContainer>
      <LockIconBox>
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="28" y="38.0001" width="47" height="43" rx="8" fill="#FFA25A" />
          <path
            d="M36.7112 32.7483H62.9902V21.0001C62.9902 15.4773 58.513 11.0001 52.9902 11.0001H46.7112C41.1883 11.0001 36.7112 15.4773 36.7112 21.0001V32.7483Z"
            stroke="#FCFCFC"
            strokeWidth="4"
          />
          <rect x="22" y="33" width="55" height="50" rx="12" stroke="#FCFCFC" strokeWidth="4" />
          <path
            d="M49.3975 48.7773C52.9007 48.7773 55.7412 51.6178 55.7412 55.1211C55.7412 57.6765 54.2291 59.8771 52.0518 60.8818C52.0927 61.0695 52.1162 61.2639 52.1162 61.4639V67.8076C52.1161 69.3089 50.8988 70.5264 49.3975 70.5264C47.8962 70.5262 46.6798 69.3089 46.6797 67.8076V61.4639C46.6797 61.264 46.7022 61.0694 46.7432 60.8818C44.5662 59.877 43.0547 57.6762 43.0547 55.1211C43.0547 51.618 45.8944 48.7776 49.3975 48.7773Z"
            fill="white"
          />
        </svg>
      </LockIconBox>
      <PrivateMessageContent>
        <PrivateMessageTitle>{t('community.private_message.title')}</PrivateMessageTitle>
        <PrivateMessageText>{t('community.private_message.description')}</PrivateMessageText>
      </PrivateMessageContent>
    </PrivateMessageContainer>
  )
}

export { PrivateMessage }
