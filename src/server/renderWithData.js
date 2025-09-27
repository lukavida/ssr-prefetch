import React from "react";
import { PrefetchProvider } from "../context";

// Support both React 17 and 18 renderToString methods
const getRenderToString = () => {
  try {
    const ReactDOMServer = require("react-dom/server");
    // React 18 has renderToString as a named export
    if (ReactDOMServer.renderToString) {
      return ReactDOMServer.renderToString;
    }
    // Fallback for older versions
    return ReactDOMServer.default || ReactDOMServer;
  } catch (error) {
    console.warn("react-dom/server not available:", error.message);
    return null;
  }
};

export default async function renderWithData(
  Component,
  context = { data: {}, requests: [] },
  renderFunction = getRenderToString()
) {
  if (!renderFunction) {
    throw new Error("renderFunction is required for server-side rendering");
  }

  if (!context.data) {
    context.data = {};
  }

  if (!context.requests) {
    context.requests = [];
  }

  const requests = [];
  const App = React.createElement(
    PrefetchProvider,
    { ...context, requests },
    Component
  );
  const html = renderFunction(App);
  if (requests.length) {
    const promises = [];
    requests.forEach(({ func }) => {
      promises.push(func());
    });
    return Promise.all(promises).then(() => {
      context.requests.push(...requests);
      return renderWithData(Component, context, renderFunction);
    });
  }

  return html;
}
