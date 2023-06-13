import { FC, useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { Rnd } from "react-rnd";
import { Keypair } from "@solana/web3.js";

import Balance from "./Balance";
import Send from "./Send";
import Transactions from "./Transactions";
import Button from "../Button";
import Input from "../Input";
import Menu from "../Menu";
import Tooltip from "../Tooltip";
import { Arrow, Close } from "../Icons";
import { WalletSettings } from "./Settings";
import { ClassName, Id } from "../../constants";
import { Fn, PgCommon, PgWallet } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";
import {
  useOnClickOutside,
  useOnKey,
  useRenderOnChange,
  useWallet,
} from "../../hooks";

const Wallet = () => {
  useRenderOnChange(PgWallet.onDidChangeShow);

  const { wallet } = useWallet();

  if (!PgWallet.show || !wallet) return null;

  const tabHeight = document
    .getElementById(Id.TABS)
    ?.getBoundingClientRect().height;

  return (
    <>
      <WalletBound id={Id.WALLET_BOUND} />
      <Rnd
        default={{
          x: window.innerWidth - (WALLET_WIDTH + 12),
          y: tabHeight ?? 32,
          width: "fit-content",
          height: "fit-content",
        }}
        minWidth={WALLET_WIDTH}
        maxWidth={WALLET_WIDTH}
        enableResizing={false}
        bounds={"#" + Id.WALLET_BOUND}
        enableUserSelectHack={false}
      >
        <WalletWrapper>
          <WalletTitle />
          <WalletMain />
        </WalletWrapper>
      </Rnd>
    </>
  );
};

const WALLET_WIDTH = 320;

const WalletBound = styled.div`
  ${({ theme }) => css`
    position: absolute;
    margin: ${theme.components.tabs.tab.default.height} 0.75rem
      ${theme.components.bottom.default.height}
      ${theme.components.sidebar.left.default.width};
    width: calc(
      100% - (0.75rem + ${theme.components.sidebar.left.default.width})
    );
    height: calc(
      100% -
        (
          ${theme.components.tabs.tab.default.height} +
            ${theme.components.bottom.default.height}
        )
    );
    z-index: -1;
  `}
`;

const WalletWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.default)};
  `}
`;

const WalletTitle = () => {
  const [rename, setRename] = useState(false);

  const showRename = useCallback(() => {
    setRename(true);
  }, []);

  const hideRename = useCallback(() => {
    setRename(false);
  }, []);

  return (
    <TitleWrapper>
      <WalletSettings showRename={showRename} />
      {rename ? <WalletRename hideRename={hideRename} /> : <WalletName />}
      <WalletClose />
    </TitleWrapper>
  );
};

const TitleWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.title.default)};
  `}
`;

const WalletName = () => {
  const { walletPkStr } = useWallet();

  const darken = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.add(ClassName.DARKEN);
  }, []);
  const lighten = useCallback(() => {
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  const getAccountDisplayName = useCallback(
    (accountName: string, pkStr: string) => {
      return (
        PgCommon.withMaxLength(accountName, 9) +
        ` - (${PgCommon.shortenPk(pkStr)})`
      );
    },
    []
  );

  return (
    <Menu
      kind="dropdown"
      items={PgWallet.accounts.map((acc, i) => ({
        name: getAccountDisplayName(
          acc.name,
          Keypair.fromSecretKey(Uint8Array.from(acc.kp)).publicKey.toBase58()
        ),
        onClick: () => PgWallet.switch(i),
        kind: "textPrimary",
      }))}
      onShow={darken}
      onHide={lighten}
    >
      <Tooltip text="Accounts">
        <Title>
          {getAccountDisplayName(PgWallet.getAccountName(), walletPkStr!)}
          <Arrow rotate="90deg" />
        </Title>
      </Tooltip>
    </Menu>
  );
};

const Title = styled.span`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.title.text)};
  `}
`;

interface WalletRenameProps {
  hideRename: Fn;
}

const WalletRename: FC<WalletRenameProps> = ({ hideRename }) => {
  const [name, setName] = useState(PgWallet.getAccountName());

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
    inputRef.current?.focus();
  }, []);

  // Close on outside clicks
  useOnClickOutside(inputRef, hideRename);

  // Close with `Escape`
  useOnKey("Escape", hideRename);

  // Submit with `Enter`
  useOnKey("Enter", () => {
    PgWallet.rename(name);
    hideRename();
  });

  return (
    <div>
      <Input
        ref={inputRef}
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        validator={PgWallet.validateAccountName}
        placeholder="Rename wallet..."
      />
    </div>
  );
};

const WalletClose = () => (
  <CloseButton onClick={() => (PgWallet.show = false)} kind="icon">
    <Close />
  </CloseButton>
);

const CloseButton = styled(Button)`
  position: absolute;
  right: 1rem;
`;

const WalletMain = () => (
  <MainWrapper id={Id.WALLET_MAIN}>
    <Balance />
    <Send />
    <Transactions />
  </MainWrapper>
);

const MainWrapper = styled.div`
  ${({ theme }) => css`
    &::after {
      content: "";
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      background: #00000000;
      pointer-events: none;
      transition: all ${theme.default.transition.duration.short}
        ${theme.default.transition.type};
    }

    &.${ClassName.DARKEN}::after {
      ${PgThemeManager.convertToCSS(theme.components.wallet.main.backdrop)};
    }

    ${PgThemeManager.convertToCSS(theme.components.wallet.main.default)};
  `}
`;

export default Wallet;
