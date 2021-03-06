export const routes = {
  root: "/",
  home: {},
  legal: {
    termsAndConditions: "/terminos-y-condiciones",
  },
  authentication: {
    signIn: "/inicia-sesion",
  },
  onboarding: {
    sendEmailVerificationCode: "/registro",
    verifyEmail: "/kyc/verifica-tu-correo",
    setPassword: "/kyc/elige-una-contrasena",
    uploadGovernmentID: "/kyc/verifica-tu-identificacion",
    setBankAccount: "/kyc/verifica-tu-cuenta-bancaria",
    done: "/kyc/fin",
  },
  recovery: {
    requestAccountRecoveryLink: "/recupera-tu-cuenta",
    resetPassword: "/restablece-tu-contrasena",
  },
  dashboard: {
    sell: {
      checkout: "/dashboard/btc/venta",
      confirm: "/dashboard/btc/venta/confirmar/tx/:id",
    },
    buy: {
      checkout: "/dashboard/btc/compra",
      confirm: "/dashboard/btc/compra/confirmar/tx/:id",
    },
    transactions: {
      index: "/dashboard/tx",
      details: "/dashboard/tx/:id",
    },
  },
};

export default routes;
