"use client";

import React from "react";
import { PageCastDevice, type PageCastDeviceProps } from "../device/PageCastDevice";

export type WebTerminalProps = PageCastDeviceProps;

export const WebTerminal: React.FC<WebTerminalProps> = (props) => {
  return <PageCastDevice {...props} />;
};
