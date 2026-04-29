import { useCallback } from 'react'
import { useTranslation } from '@dcl/hooks'
import { AnimatedBackground } from 'decentraland-ui2'
import helpGirl from '../../images/help_girl.png'
import {
  ChatCtaBanner,
  ChatCtaBannerContent,
  ChatCtaBannerImage,
  ChatCtaBannerSubtitle,
  ChatCtaBannerTexts,
  ChatCtaBannerTitle,
  ChatCtaButton
} from '../../pages/help/HelpPage.styled'
import { IntercomWidget } from '../Intercom/IntercomWidget'

const CHAT_CTA_PREFIX = 'component.landing.help.chat_cta'

const ChatCTABanner = () => {
  const { t } = useTranslation()

  const handleChatNow = useCallback(() => {
    const widget = IntercomWidget.getInstance()
    if (widget.appId) {
      widget.show()
    }
  }, [])

  return (
    <ChatCtaBanner>
      <AnimatedBackground variant="absolute" />
      <ChatCtaBannerContent>
        <ChatCtaBannerTexts>
          <ChatCtaBannerTitle>{t(`${CHAT_CTA_PREFIX}.title`)}</ChatCtaBannerTitle>
          <ChatCtaBannerSubtitle>{t(`${CHAT_CTA_PREFIX}.subtitle`)}</ChatCtaBannerSubtitle>
          <ChatCtaButton onClick={handleChatNow}>{t(`${CHAT_CTA_PREFIX}.button`)}</ChatCtaButton>
        </ChatCtaBannerTexts>
      </ChatCtaBannerContent>
      <ChatCtaBannerImage src={helpGirl} alt="" aria-hidden="true" />
    </ChatCtaBanner>
  )
}

export { ChatCTABanner }
