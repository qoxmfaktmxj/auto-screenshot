const config = {
  use: {
    browserName: "chromium",
    headless: true
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium"
      }
    }
  ]
};

export default config;
