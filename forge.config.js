const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'public\\Images\\star-trek-png-logo-3554.ico',
        setupExe: 'LCARS-Setup.exe',
        noMsi: false, // Enable MSI creation alongside EXE
        setupMsi: 'LCARS-Setup.msi',
        remoteReleases: false,
        // Additional options for better installer experience
        loadingGif: 'public\\Images\\star-trek-png-logo-3554.ico',
        authors: 'TealInc',
        owners: 'TealInc',
        description: 'WinLCARS Interface - Library Computer Access/Retrieval System for Windows',
        iconUrl: 'https://raw.githubusercontent.com/jerichijer/LCARS/main/public/Images/star-trek-png-logo-3554.ico',
        setupIcon: 'public\\Images\\star-trek-png-logo-3554.ico'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
