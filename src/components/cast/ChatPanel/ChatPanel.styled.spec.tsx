jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const passthrough = (tag: string) =>
    ReactLib.forwardRef(({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
      ReactLib.createElement(tag, { ref, ...(rest as Record<string, unknown>) }, children)
    )
  return {
    ...actual,
    Button: passthrough('button'),
    Typography: passthrough('p'),
    Input: passthrough('input')
  }
})

import { render } from '@testing-library/react'
import {
  AuthSection,
  ChatContainer,
  ChatFooter,
  ChatHeader,
  ChatHeaderActions,
  ChatInputContainer,
  ChatInputSection,
  ChatMessage,
  ChatMessages,
  CloseButton,
  EmptyChat,
  FooterLink,
  MessageContent,
  MessageCount,
  MessageHeader,
  MessageTime,
  MessageWrapper,
  ParticipantName,
  SendButton,
  StyledInput
} from './ChatPanel.styled'

describe('ChatPanel styled components', () => {
  it('renders every exported styled element through the styledMock theme', () => {
    render(
      <>
        <ChatContainer>
          <ChatHeader>
            <ChatHeaderActions />
            <MessageCount>1</MessageCount>
            <CloseButton />
          </ChatHeader>
          <ChatMessages>
            <EmptyChat>empty</EmptyChat>
            <ChatMessage>
              <MessageWrapper>
                <MessageHeader>
                  <ParticipantName>alice</ParticipantName>
                  <MessageTime>now</MessageTime>
                </MessageHeader>
                <MessageContent>hello</MessageContent>
              </MessageWrapper>
            </ChatMessage>
          </ChatMessages>
          <ChatInputSection>
            <AuthSection />
            <ChatInputContainer>
              <StyledInput />
              <SendButton />
            </ChatInputContainer>
          </ChatInputSection>
          <ChatFooter>
            <FooterLink href="#">link</FooterLink>
          </ChatFooter>
        </ChatContainer>
      </>
    )
  })
})
