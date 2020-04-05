import { SendPhoneNumberVerificationCodeInput } from "@ibexcm/libraries/api";
import {
  Box,
  Container,
  Grid,
  Hidden,
  Theme,
  withStyles,
  WithStyles,
} from "@material-ui/core";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import React from "react";
import { RouteComponentProps, StaticContext } from "react-router";
import { Button, ToolbarPadding, Typography } from "../../../common/components";
import DependencyContext from "../../../common/contexts/DependencyContext";
import { styles } from "../../../common/theme";
import routes from "../../../routes";
import { OnboardingRepositoryInjectionKeys } from "../../onboarding/InjectionKeys";
import { MobileNavBar, NavBar } from "../components";

interface Props
  extends WithStyles,
    RouteComponentProps<{}, StaticContext, SendPhoneNumberVerificationCodeInput> {}

const Component: React.FC<Props> = ({ classes, history, location, match, ...props }) => {
  const dependencies = React.useContext(DependencyContext);
  const OnboardingRepository = dependencies.provide(OnboardingRepositoryInjectionKeys);

  React.useEffect(() => {
    (() => {
      const script = document.createElement("script");
      script.src =
        "https://static.zdassets.com/ekr/snippet.js?key=52b88740-ebcc-4f1c-81e1-4fd827f40adf";
      script.id = "ze-snippet";
      document.querySelector("body").appendChild(script);
    })();
  }, []);

  const onCreateAccount = () => {
    OnboardingRepository.reset();
    history.push(routes.onboarding.sendPhoneNumberVerificationCode);
  };

  return (
    <Box className={classes.homeContainer}>
      <Container maxWidth="lg">
        <MobileNavBar />
        <NavBar />
        <Box
          minHeight="100vh"
          flexDirection="column"
          display="flex"
          justifyContent="center"
        >
          <ToolbarPadding />
          <Grid container>
            <Grid item lg={7}>
              <Box className={classes.introText}>
                <Typography variant="h5" fontWeight={500}>
                  <em>ACTIVOS DIGITALES EN QUETZALES</em>
                </Typography>
              </Box>
              <Box mb={6} mt={3}>
                <Grid container spacing={1} wrap="nowrap">
                  <Grid item>
                    <CheckCircleOutlineIcon fontSize="small" color="primary" />
                  </Grid>
                  <Grid item>
                    <Typography fontWeight={500} gutterBottom>
                      La mejor tarifa del mercado guatemalteco.
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={1} wrap="nowrap">
                  <Grid item>
                    <CheckCircleOutlineIcon fontSize="small" color="primary" />
                  </Grid>
                  <Grid item>
                    <Typography fontWeight={500} gutterBottom>
                      Transferencias directas a tu wallet / cuenta bancaria en menos de 24
                      hrs
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={1} wrap="nowrap">
                  <Grid item>
                    <CheckCircleOutlineIcon fontSize="small" color="primary" />
                  </Grid>
                  <Grid item>
                    <Typography fontWeight={500}>
                      Deposita / transfiere tus Q's o USD's a nuestras cuentas en el BAC
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Hidden only={["xs", "sm", "lg", "md", "xl"]}>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={onCreateAccount}
                  className={classes.ctaButton}
                >
                  Crea una cuenta
                </Button>
              </Hidden>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export const Home = withStyles((theme: Theme) => ({
  ...styles(theme),
  homeContainer: {
    backgroundColor: "white",
  },
  introText: {
    "& h5": {
      fontWeight: 900,
      [theme.breakpoints.up("sm")]: {
        fontSize: theme.typography.h3.fontSize,
        fontWeight: 900,
      },
    },
  },
  ctaButton: {
    [theme.breakpoints.up("sm")]: {
      width: "auto",
    },
  },
  currencyPairText: {
    fontWeight: 500,
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down("sm")]: {
      fontSize: theme.typography.body1.fontSize,
    },
  },
  currencyPairsRow: {
    "& svg": {
      fontSize: theme.typography.h5.fontSize,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      height: "32px",
      [theme.breakpoints.down("sm")]: {
        fontSize: theme.typography.body1.fontSize,
        height: "22px",
      },
    },
  },
}))(Component);
