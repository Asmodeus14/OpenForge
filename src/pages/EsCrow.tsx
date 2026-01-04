// pages/milestones.tsx
import React, { useState, useEffect, useMemo } from "react";
import { ethers } from "ethers";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge,
  Tooltip,
  Collapse,
  CardActions,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
  Drawer,
  useTheme,
  useMediaQuery,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  GasMeter as GasMeterIcon,
  PriceChange as PriceChangeIcon,
  LocalAtm as LocalAtmIcon,
  Menu as MenuIcon,
  Link as LinkIcon,
  Token as TokenIcon,
  Search as SearchIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  AccountBalance as AccountBalanceIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  purple,
  deepPurple,
  indigo,
  teal,
  orange,
  red,
  grey,
  blueGrey,
  cyan,
} from "@mui/material/colors";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";
import MuiAlert, { type AlertProps } from "@mui/material/Alert";
import Sidebar from "../component/Sidebar";

// Import contract ABIs
import {
  SimpleMilestoneEscrowABI,
  SimpleMilestoneEscrowBytecode,
  OpenForgeProjectRegistryABI,
  REGISTRY_ADDRESS,
} from "../ESCROW/ABI";

// Import profile utilities
import {
  useProfiles,
  formatWalletAddress,
  getDisplayName,
  getAvatarUrl,
} from "../hooks/useProfile";

// Create black theme with visible purple text
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9c27b0", // Bright purple
      light: "#ba68c8",
      dark: "#7b1fa2",
    },
    secondary: {
      main: "#00bcd4", // Cyan
      light: "#4dd0e1",
      dark: "#00838f",
    },
    background: {
      default: "#000000", // Pure black
      paper: "#0a0a0a", // Very dark grey
    },
    success: {
      main: "#4caf50",
    },
    warning: {
      main: "#ff9800",
    },
    error: {
      main: "#f44336",
    },
    info: {
      main: "#2196f3",
    },
    text: {
      primary: "#ffffff", // White for main text
      secondary: "#ba68c8", // Light purple for secondary text
      disabled: "#666666",
    },
    divider: "rgba(156, 39, 176, 0.2)", // Purple divider
    action: {
      active: "#ba68c8",
      hover: "rgba(156, 39, 176, 0.08)",
      selected: "rgba(156, 39, 176, 0.16)",
      disabled: "rgba(255, 255, 255, 0.3)",
      disabledBackground: "rgba(255, 255, 255, 0.12)",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      color: "#ffffff",
      fontWeight: 700,
    },
    h2: {
      color: "#ffffff",
      fontWeight: 700,
    },
    h3: {
      color: "#ffffff",
      fontWeight: 700,
    },
    h4: {
      color: "#ffffff",
      fontWeight: 700,
      background: "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    h5: {
      color: "#ffffff",
      fontWeight: 600,
    },
    h6: {
      color: "#ba68c8", // Light purple
      fontWeight: 600,
    },
    subtitle1: {
      color: "#ba68c8", // Light purple
      fontWeight: 500,
    },
    subtitle2: {
      color: "#ba68c8", // Light purple
      fontWeight: 500,
    },
    body1: {
      color: "#ffffff", // White
    },
    body2: {
      color: "#ba68c8", // Light purple
    },
    caption: {
      color: "#9e9e9e",
    },
    button: {
      color: "#ffffff",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#000000",
          color: "#ffffff",
          scrollbarColor: `${purple[700]} #000000`,
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: purple[700],
            minHeight: 24,
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus":
            {
              backgroundColor: purple[800],
            },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active":
            {
              backgroundColor: purple[800],
            },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover":
            {
              backgroundColor: purple[600],
            },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#000000",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a",
          borderRadius: 12,
          backgroundImage: "none",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          border: `1px solid rgba(156, 39, 176, 0.2)`,
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 30px rgba(156, 39, 176, 0.3)",
            borderColor: "rgba(156, 39, 176, 0.3)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#0a0a0a",
          border: `1px solid rgba(156, 39, 176, 0.2)`,
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(156, 39, 176, 0.3)",
            borderColor: "rgba(156, 39, 176, 0.4)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.5px",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        },
        contained: {
          background: "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
          color: "#ffffff",
          boxShadow: "0 4px 15px rgba(156, 39, 176, 0.4)",
          "&:hover": {
            background: "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
            boxShadow: "0 6px 20px rgba(156, 39, 176, 0.5)",
          },
          "&.Mui-disabled": {
            background: "rgba(156, 39, 176, 0.3)",
            color: "rgba(255, 255, 255, 0.5)",
          },
        },
        outlined: {
          borderColor: "rgba(156, 39, 176, 0.4)",
          color: "#ba68c8",
          "&:hover": {
            borderColor: "#9c27b0",
            backgroundColor: "rgba(156, 39, 176, 0.1)",
          },
        },
        text: {
          color: "#ba68c8",
          "&:hover": {
            backgroundColor: "rgba(156, 39, 176, 0.1)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputLabel-root": {
            color: "#ba68c8",
            "&.Mui-focused": {
              color: "#9c27b0",
            },
            "&.Mui-error": {
              color: "#f44336",
            },
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            color: "#ffffff",
            "& fieldset": {
              borderColor: "rgba(156, 39, 176, 0.4)",
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: "rgba(156, 39, 176, 0.6)",
              borderWidth: "1px",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#9c27b0",
              borderWidth: "2px",
            },
            "&.Mui-error fieldset": {
              borderColor: "#f44336",
            },
            "& .MuiInputBase-input": {
              color: "#ffffff",
              "&::placeholder": {
                color: "rgba(255, 255, 255, 0.5)",
              },
            },
            "& .MuiInputAdornment-root .MuiTypography-root": {
              color: "#ba68c8",
            },
          },
          "& .MuiFormHelperText-root": {
            color: "#ba68c8",
            fontSize: "0.75rem",
            marginTop: "4px",
            "&.Mui-error": {
              color: "#f44336",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(156, 39, 176, 0.4)",
            borderWidth: "1px",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(156, 39, 176, 0.6)",
            borderWidth: "1px",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9c27b0",
            borderWidth: "2px",
          },
          "& .MuiSelect-select": {
            color: "#ffffff",
            padding: "12.5px 14px",
          },
        },
        icon: {
          color: "#ba68c8",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#ba68c8",
          "&.Mui-focused": {
            color: "#9c27b0",
          },
          "&.Mui-error": {
            color: "#f44336",
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(156, 39, 176, 0.15)",
          "& th": {
            borderBottom: `2px solid rgba(156, 39, 176, 0.4)`,
            color: "#ba68c8",
            fontWeight: 600,
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "rgba(156, 39, 176, 0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(156, 39, 176, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(156, 39, 176, 0.25)",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid rgba(255, 255, 255, 0.12)`,
          color: "#ffffff",
          fontSize: "0.875rem",
          padding: "12px 16px",
        },
        head: {
          color: "#ba68c8",
          fontWeight: 600,
          fontSize: "0.875rem",
        },
        body: {
          color: "#ffffff",
          fontSize: "0.875rem",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          color: "#ffffff",
          fontSize: "0.75rem",
          height: "auto",
          "& .MuiChip-label": {
            color: "inherit",
            padding: "4px 8px",
          },
        },
        colorPrimary: {
          backgroundColor: "rgba(156, 39, 176, 0.25)",
          color: "#ba68c8",
          border: `1px solid rgba(156, 39, 176, 0.4)`,
        },
        colorSecondary: {
          backgroundColor: "rgba(0, 188, 212, 0.25)",
          color: "#4dd0e1",
          border: `1px solid rgba(0, 188, 212, 0.4)`,
        },
        colorSuccess: {
          backgroundColor: "rgba(76, 175, 80, 0.25)",
          color: "#81c784",
          border: `1px solid rgba(76, 175, 80, 0.4)`,
        },
        colorError: {
          backgroundColor: "rgba(244, 67, 54, 0.25)",
          color: "#e57373",
          border: `1px solid rgba(244, 67, 54, 0.4)`,
        },
        colorWarning: {
          backgroundColor: "rgba(255, 152, 0, 0.25)",
          color: "#ffb74d",
          border: `1px solid rgba(255, 152, 0, 0.4)`,
        },
        colorInfo: {
          backgroundColor: "rgba(33, 150, 243, 0.25)",
          color: "#64b5f6",
          border: `1px solid rgba(33, 150, 243, 0.4)`,
        },
        outlined: {
          borderColor: "rgba(156, 39, 176, 0.4)",
          color: "#ba68c8",
          "& .MuiChip-label": {
            color: "#ba68c8",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          border: `1px solid rgba(156, 39, 176, 0.3)`,
          "& .MuiAlert-icon": {
            color: "#ba68c8",
            fontSize: "1.25rem",
          },
          "& .MuiAlert-message": {
            color: "#ffffff",
            fontSize: "0.875rem",
          },
        },
        standardSuccess: {
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          borderColor: "rgba(76, 175, 80, 0.4)",
          "& .MuiAlert-icon": {
            color: "#81c784",
          },
        },
        standardWarning: {
          backgroundColor: "rgba(255, 152, 0, 0.15)",
          borderColor: "rgba(255, 152, 0, 0.4)",
          "& .MuiAlert-icon": {
            color: "#ffb74d",
          },
        },
        standardError: {
          backgroundColor: "rgba(244, 67, 54, 0.15)",
          borderColor: "rgba(244, 67, 54, 0.4)",
          "& .MuiAlert-icon": {
            color: "#e57373",
          },
        },
        standardInfo: {
          backgroundColor: "rgba(156, 39, 176, 0.15)",
          borderColor: "rgba(156, 39, 176, 0.4)",
          "& .MuiAlert-icon": {
            color: "#ba68c8",
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          borderRadius: 4,
          height: 8,
        },
        bar: {
          backgroundColor: "#9c27b0",
          borderRadius: 4,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          padding: "16px 0",
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        root: {
          "& .MuiStepLabel-label": {
            color: "#ba68c8",
            fontSize: "0.875rem",
            fontWeight: 500,
            "&.Mui-active": {
              color: "#ffffff",
              fontWeight: 600,
            },
            "&.Mui-completed": {
              color: "#4caf50",
            },
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "rgba(156, 39, 176, 0.4)",
          fontSize: "1.5rem",
          "&.Mui-active": {
            color: "#9c27b0",
          },
          "&.Mui-completed": {
            color: "#4caf50",
          },
          "& text": {
            fill: "#ffffff",
            fontSize: "0.75rem",
            fontWeight: 600,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderBottom: `1px solid rgba(156, 39, 176, 0.2)`,
        },
        indicator: {
          backgroundColor: "#9c27b0",
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "#ba68c8",
          fontWeight: 500,
          fontSize: "0.875rem",
          textTransform: "none",
          minHeight: "48px",
          "&.Mui-selected": {
            color: "#ffffff",
            fontWeight: 600,
          },
          "&:hover": {
            color: "#ffffff",
            backgroundColor: "rgba(156, 39, 176, 0.08)",
          },
          "& .MuiTab-iconWrapper": {
            color: "inherit",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `2px solid rgba(156, 39, 176, 0.4)`,
          backgroundColor: "rgba(156, 39, 176, 0.15)",
          color: "#ba68c8",
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0a0a0a",
          borderRadius: 16,
          border: `1px solid rgba(156, 39, 176, 0.3)`,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          backgroundColor: "rgba(156, 39, 176, 0.15)",
          borderBottom: `1px solid rgba(156, 39, 176, 0.3)`,
          padding: "20px 24px",
          fontSize: "1.25rem",
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          padding: "24px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderTop: `1px solid rgba(156, 39, 176, 0.2)`,
          padding: "16px 24px",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#000000",
          borderRight: `1px solid rgba(156, 39, 176, 0.2)`,
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          padding: "8px 0",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "rgba(156, 39, 176, 0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(156, 39, 176, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(156, 39, 176, 0.2)",
            },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#ffffff",
          fontSize: "0.875rem",
          fontWeight: 500,
        },
        secondary: {
          color: "#ba68c8",
          fontSize: "0.75rem",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(156, 39, 176, 0.2)",
          margin: "16px 0",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "#ba68c8",
          "&:hover": {
            backgroundColor: "rgba(156, 39, 176, 0.15)",
          },
          "&.Mui-disabled": {
            color: "rgba(156, 39, 176, 0.3)",
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: "#9c27b0",
          color: "#ffffff",
          fontSize: "0.75rem",
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          border: `1px solid rgba(156, 39, 176, 0.4)`,
          fontSize: "0.75rem",
          padding: "8px 12px",
          maxWidth: "300px",
        },
        arrow: {
          color: "#0a0a0a",
          "&::before": {
            border: `1px solid rgba(156, 39, 176, 0.4)`,
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#9c27b0",
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          "& .MuiTypography-root": {
            color: "#ffffff",
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#ba68c8",
          "&.Mui-checked": {
            color: "#9c27b0",
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: "#ba68c8",
          "&.Mui-checked": {
            color: "#9c27b0",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase": {
            color: "#ba68c8",
          },
          "& .MuiSwitch-track": {
            backgroundColor: "rgba(156, 39, 176, 0.3)",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            padding: "4px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            "& .MuiAutocomplete-input": {
              color: "#ffffff",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#ba68c8",
          },
        },
        popupIndicator: {
          color: "#ba68c8",
        },
        clearIndicator: {
          color: "#ba68c8",
        },
        option: {
          color: "#ffffff",
          '&[aria-selected="true"]': {
            backgroundColor: "rgba(156, 39, 176, 0.15)",
          },
          '&[data-focus="true"]': {
            backgroundColor: "rgba(156, 39, 176, 0.08)",
          },
        },
        paper: {
          backgroundColor: "#0a0a0a",
          border: "1px solid rgba(156, 39, 176, 0.4)",
          color: "#ffffff",
        },
      },
    },
  },
});

// Alert component for Snackbar
const AlertComponent = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }
);

declare global {
  interface Window {
    ethereum: any;
  }
}

interface MilestoneInput {
  amount: string;
  deadline: Dayjs | null;
  description: string;
}

interface Milestone {
  amount: string;
  released: boolean;
  cancelled: boolean;
  deadline: string;
  description: string;
  canRelease: boolean;
  canCancel: boolean;
  isOverdue: boolean;
}

interface DeployedContract {
  projectId: number;
  escrowAddress: string;
  title: string;
  description: string;
  funder: string;
  developer: string;
  status: string;
  totalAmount: string;
  releasedAmount: string;
  paymentToken: string;
  paymentTokenSymbol: string;
  paymentTokenDecimals: number;
  active: boolean;
  milestones: Milestone[];
  userRole: "funder" | "developer";
  creationDate?: string;
  disputeReason?: string;
}

// URL Parameter types
interface URLParams {
  title?: string;
  description?: string;
  tags?: string;
  developerAddress?: string;
  paymentTokenAddress?: string;
  milestones?: string;
  action?: string;
}

// Network information interface
interface NetworkInfo {
  chainId: number;
  name: string;
  nativeToken: string;
  explorer: string;
  isTestnet: boolean;
}

// ERC20 Token interface
interface ERC20Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  network: string;
  chainId: number;
  isStablecoin?: boolean;
  isNativeWrapped?: boolean;
}

// Common ERC20 Tokens for dropdown
const COMMON_ERC20_TOKENS: ERC20Token[] = [
  // Ethereum Mainnet Tokens
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    network: "Ethereum",
    chainId: 1,
    isStablecoin: true,
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    network: "Ethereum",
    chainId: 1,
    isStablecoin: true,
  },
  {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    network: "Ethereum",
    chainId: 1,
    isStablecoin: true,
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    network: "Ethereum",
    chainId: 1,
  },
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    network: "Ethereum",
    chainId: 1,
    isNativeWrapped: true,
  },

  // Sepolia Testnet Tokens
  {
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia USDC
    symbol: "USDC",
    name: "USD Coin (Sepolia)",
    decimals: 6,
    network: "Sepolia",
    chainId: 11155111,
    isStablecoin: true,
  },
  {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Sepolia USDT
    symbol: "USDT",
    name: "Tether USD (Sepolia)",
    decimals: 6,
    network: "Sepolia",
    chainId: 11155111,
    isStablecoin: true,
  },
  {
    address: "0xffFfFfffFffFffFffffffffffffFFFFFFfFEbcdAF", // Sepolia WETH
    symbol: "WETH",
    name: "Wrapped Ether (Sepolia)",
    decimals: 18,
    network: "Sepolia",
    chainId: 11155111,
    isNativeWrapped: true,
  },

  // Arbitrum Tokens
  {
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
    symbol: "USDT",
    name: "Tether USD (Arbitrum)",
    decimals: 6,
    network: "Arbitrum",
    chainId: 42161,
    isStablecoin: true,
  },
  {
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // Arbitrum USDC
    symbol: "USDC",
    name: "USD Coin (Arbitrum)",
    decimals: 6,
    network: "Arbitrum",
    chainId: 42161,
    isStablecoin: true,
  },
  {
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // Arbitrum DAI
    symbol: "DAI",
    name: "Dai Stablecoin (Arbitrum)",
    decimals: 18,
    network: "Arbitrum",
    chainId: 42161,
    isStablecoin: true,
  },

  // Arbitrum Sepolia Testnet
  {
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia USDC
    symbol: "USDC",
    name: "USD Coin (Arbitrum Sepolia)",
    decimals: 6,
    network: "Arbitrum Sepolia",
    chainId: 421614,
    isStablecoin: true,
  },

  // Polygon Tokens
  {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon USDT
    symbol: "USDT",
    name: "Tether USD (Polygon)",
    decimals: 6,
    network: "Polygon",
    chainId: 137,
    isStablecoin: true,
  },
  {
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
    symbol: "USDC",
    name: "USD Coin (Polygon)",
    decimals: 6,
    network: "Polygon",
    chainId: 137,
    isStablecoin: true,
  },
  {
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // Polygon DAI
    symbol: "DAI",
    name: "Dai Stablecoin (Polygon)",
    decimals: 18,
    network: "Polygon",
    chainId: 137,
    isStablecoin: true,
  },
  {
    address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // Polygon WMATIC
    symbol: "WMATIC",
    name: "Wrapped MATIC",
    decimals: 18,
    network: "Polygon",
    chainId: 137,
    isNativeWrapped: true,
  },

  // Optimism Tokens
  {
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // Optimism USDT
    symbol: "USDT",
    name: "Tether USD (Optimism)",
    decimals: 6,
    network: "Optimism",
    chainId: 10,
    isStablecoin: true,
  },
  {
    address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // Optimism USDC
    symbol: "USDC",
    name: "USD Coin (Optimism)",
    decimals: 6,
    network: "Optimism",
    chainId: 10,
    isStablecoin: true,
  },
  {
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // Optimism DAI
    symbol: "DAI",
    name: "Dai Stablecoin (Optimism)",
    decimals: 18,
    network: "Optimism",
    chainId: 10,
    isStablecoin: true,
  },

  // Add more tokens for other networks...
];

// Group tokens by network
const TOKENS_BY_NETWORK = COMMON_ERC20_TOKENS.reduce((acc, token) => {
  if (!acc[token.network]) {
    acc[token.network] = [];
  }
  acc[token.network].push(token);
  return acc;
}, {} as Record<string, ERC20Token[]>);

// Format large numbers
const formatLargeNumber = (num: number | string): string => {
  const value = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(value)) return "0";

  if (value >= 1e12) {
    return (value / 1e12).toFixed(2) + "T";
  } else if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + "B";
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + "M";
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + "K";
  } else if (value < 0.001) {
    return value.toExponential(2);
  } else if (value < 1) {
    return value.toPrecision(4);
  } else {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
};

// Calculate fee (1.5%)
const calculateFee = (amount: number): number => {
  return amount * 0.015;
};

// Calculate net amount (98.5%)
const calculateNetAmount = (amount: number): number => {
  return amount * 0.985;
};

// Get network information by chain ID
const getNetworkInfo = (chainId: bigint): NetworkInfo => {
  const chainIdStr = chainId.toString();

  switch (chainIdStr) {
    case "1": // Ethereum Mainnet
      return {
        chainId: 1,
        name: "Ethereum",
        nativeToken: "ETH",
        explorer: "https://etherscan.io",
        isTestnet: false,
      };
    case "11155111": // Sepolia Testnet
      return {
        chainId: 11155111,
        name: "Sepolia",
        nativeToken: "SepoliaETH",
        explorer: "https://sepolia.etherscan.io",
        isTestnet: true,
      };
    case "5": // Goerli Testnet
      return {
        chainId: 5,
        name: "Goerli",
        nativeToken: "GoerliETH",
        explorer: "https://goerli.etherscan.io",
        isTestnet: true,
      };
    case "42161": // Arbitrum One
      return {
        chainId: 42161,
        name: "Arbitrum",
        nativeToken: "ETH",
        explorer: "https://arbiscan.io",
        isTestnet: false,
      };
    case "421614": // Arbitrum Sepolia
      return {
        chainId: 421614,
        name: "Arbitrum Sepolia",
        nativeToken: "ArbETH",
        explorer: "https://sepolia.arbiscan.io",
        isTestnet: true,
      };
    case "137": // Polygon Mainnet
      return {
        chainId: 137,
        name: "Polygon",
        nativeToken: "MATIC",
        explorer: "https://polygonscan.com",
        isTestnet: false,
      };
    case "80001": // Mumbai Testnet
      return {
        chainId: 80001,
        name: "Mumbai",
        nativeToken: "MATIC",
        explorer: "https://mumbai.polygonscan.com",
        isTestnet: true,
      };
    case "56": // BSC Mainnet
      return {
        chainId: 56,
        name: "BNB Chain",
        nativeToken: "BNB",
        explorer: "https://bscscan.com",
        isTestnet: false,
      };
    case "97": // BSC Testnet
      return {
        chainId: 97,
        name: "BNB Testnet",
        nativeToken: "tBNB",
        explorer: "https://testnet.bscscan.com",
        isTestnet: true,
      };
    case "10": // Optimism
      return {
        chainId: 10,
        name: "Optimism",
        nativeToken: "ETH",
        explorer: "https://optimistic.etherscan.io",
        isTestnet: false,
      };
    case "420": // Optimism Goerli
      return {
        chainId: 420,
        name: "Optimism Goerli",
        nativeToken: "ETH",
        explorer: "https://goerli-optimism.etherscan.io",
        isTestnet: true,
      };
    case "8453": // Base Mainnet
      return {
        chainId: 8453,
        name: "Base",
        nativeToken: "ETH",
        explorer: "https://basescan.org",
        isTestnet: false,
      };
    case "84531": // Base Goerli
      return {
        chainId: 84531,
        name: "Base Goerli",
        nativeToken: "ETH",
        explorer: "https://goerli.basescan.org",
        isTestnet: true,
      };
    default:
      return {
        chainId: Number(chainId),
        name: "Unknown Network",
        nativeToken: "Native Token",
        explorer: "https://etherscan.io",
        isTestnet: false,
      };
  }
};

// Parse URL parameters from current window location
const parseURLParams = (): URLParams => {
  const params: URLParams = {};

  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has("title"))
      params.title = decodeURIComponent(urlParams.get("title")!);
    if (urlParams.has("description"))
      params.description = decodeURIComponent(urlParams.get("description")!);
    if (urlParams.has("tags"))
      params.tags = decodeURIComponent(urlParams.get("tags")!);
    if (urlParams.has("developer"))
      params.developerAddress = urlParams.get("developer")!;
    if (urlParams.has("paymentToken"))
      params.paymentTokenAddress = urlParams.get("paymentToken")!;
    if (urlParams.has("milestones"))
      params.milestones = urlParams.get("milestones")!;

    // Parse path parameters (action from URL path)
    const pathParts = window.location.pathname.split("/");
    const actionIndex = pathParts.indexOf("contracts") + 1;
    if (actionIndex < pathParts.length && pathParts[actionIndex]) {
      params.action = pathParts[actionIndex];
    }
  }

  return params;
};

// Parse milestones from URL parameter (format: amount1:description1|amount2:description2)
const parseMilestonesFromURL = (milestonesParam: string): MilestoneInput[] => {
  if (!milestonesParam)
    return [{ amount: "", deadline: null, description: "" }];

  try {
    const milestones: MilestoneInput[] = [];
    const parts = milestonesParam.split("|");

    parts.forEach((part) => {
      const [amount, description] = part.split(":");
      if (amount && description) {
        milestones.push({
          amount: amount.trim(),
          deadline: null,
          description: decodeURIComponent(description.trim()),
        });
      }
    });

    return milestones.length > 0
      ? milestones
      : [{ amount: "", deadline: null, description: "" }];
  } catch (error) {
    console.error("Error parsing milestones from URL:", error);
    return [{ amount: "", deadline: null, description: "" }];
  }
};

// Parse tags from URL parameter (format: tag1,tag2,tag3)
const parseTagsFromURL = (tagsParam: string): string[] => {
  if (!tagsParam) return [];

  try {
    return tagsParam
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
  } catch (error) {
    console.error("Error parsing tags from URL:", error);
    return [];
  }
};

// Address with Profile Component
const AddressWithProfile: React.FC<{
  address: string;
  profile: any;
  showYou?: boolean;
  isCurrentUser?: boolean;
}> = ({ address, profile, showYou = true, isCurrentUser = false }) => {
  const displayName = getDisplayName(address, profile);
  const avatarUrl = getAvatarUrl(profile);
  const formattedAddress = formatWalletAddress(address);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip
        title={
          profile?.name
            ? `${profile.name} (${formattedAddress})`
            : formattedAddress
        }
      >
        <Avatar
          src={avatarUrl || undefined}
          sx={{
            width: 32,
            height: 32,
            bgcolor: isCurrentUser
              ? "rgba(156, 39, 176, 0.2)"
              : "rgba(0, 188, 212, 0.2)",
            color: isCurrentUser ? "#ba68c8" : "#4dd0e1",
            border: `2px solid ${isCurrentUser ? "#9c27b0" : "#00bcd4"}`,
            fontWeight: 600,
            boxShadow: `0 0 10px ${
              isCurrentUser
                ? "rgba(156, 39, 176, 0.3)"
                : "rgba(0, 188, 212, 0.3)"
            }`,
          }}
        >
          {avatarUrl
            ? null
            : profile?.name?.charAt(0)?.toUpperCase() ||
              formattedAddress?.charAt(0)?.toUpperCase()}
        </Avatar>
      </Tooltip>
      <Box>
        <Typography
          variant="body2"
          component="div"
          fontWeight={600}
          sx={{ color: isCurrentUser ? "#ba68c8" : "#4dd0e1" }}
        >
          {displayName}
          {isCurrentUser && showYou && (
            <Chip
              label="You"
              size="small"
              sx={{
                ml: 1,
                bgcolor: "rgba(156, 39, 176, 0.2)",
                color: "#ba68c8",
                fontSize: "0.6rem",
                height: 20,
                border: `1px solid rgba(156, 39, 176, 0.3)`,
              }}
            />
          )}
        </Typography>
        {profile?.name && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ fontFamily: "monospace", color: "#9e9e9e" }}
          >
            {formattedAddress}
          </Typography>
        )}
      </Box>
      {profile?.name && (
        <Tooltip title="Verified Profile">
          <VerifiedIcon
            fontSize="small"
            sx={{
              color: "#4caf50",
              filter: "drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))",
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

// Token Dropdown Component
const TokenDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  networkInfo: NetworkInfo;
}> = ({ value, onChange, disabled = false, networkInfo }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Filter tokens by current network or show all
  const filteredTokens = COMMON_ERC20_TOKENS.filter(
    (token) =>
      token.chainId === networkInfo.chainId || networkInfo.chainId === 1 // Show Ethereum tokens for all networks
  );

  // Add custom token option
  const tokenOptions = [
    ...filteredTokens,
    {
      address: "",
      symbol: "Custom Token",
      name: "Enter custom ERC20 address",
      decimals: 18,
      network: "Custom",
      chainId: networkInfo.chainId,
    },
  ];

  const selectedToken =
    tokenOptions.find((token) => token.address === value) ||
    tokenOptions.find(
      (token) => token.address.toLowerCase() === value.toLowerCase()
    );

  const handleTokenChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel sx={{ color: "#ba68c8" }}>Payment Token</InputLabel>
        <Select
          value={value || ""}
          label="Payment Token"
          onChange={(e) => handleTokenChange(e.target.value)}
          renderValue={(selected) => {
            const token = tokenOptions.find((t) => t.address === selected);
            if (!token) return "Select a token";
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {token.symbol === "Custom Token" ? (
                  <SearchIcon fontSize="small" sx={{ color: "#ffb74d" }} />
                ) : (
                  <TokenIcon
                    fontSize="small"
                    sx={{
                      color: token.isStablecoin
                        ? "#4caf50"
                        : token.isNativeWrapped
                        ? "#2196f3"
                        : "#ba68c8",
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      token.symbol === "Custom Token" ? "#ffb74d" : "#ffffff",
                  }}
                >
                  {token.symbol}
                </Typography>
                {token.network && token.network !== "Custom" && (
                  <Chip
                    label={token.network}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 20,
                      fontSize: "0.6rem",
                      bgcolor: "rgba(156, 39, 176, 0.15)",
                      color: "#ba68c8",
                      border: `1px solid rgba(156, 39, 176, 0.3)`,
                    }}
                  />
                )}
              </Box>
            );
          }}
          sx={{
            "& .MuiSelect-select": {
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(156, 39, 176, 0.4)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(156, 39, 176, 0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#9c27b0",
            },
          }}
        >
          {/* Network-specific tokens */}
          {Object.entries(TOKENS_BY_NETWORK).map(
            ([network, tokens]) =>
              tokens.some(
                (t) =>
                  t.chainId === networkInfo.chainId || networkInfo.chainId === 1
              ) && (
                <Box key={network}>
                  <MenuItem
                    disabled
                    sx={{
                      color: "#ba68c8",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      opacity: 0.7,
                      borderBottom: "1px solid rgba(156, 39, 176, 0.2)",
                      mt: 1,
                    }}
                  >
                    {network} Network
                  </MenuItem>
                  {tokens
                    .filter(
                      (token) =>
                        token.chainId === networkInfo.chainId ||
                        networkInfo.chainId === 1
                    )
                    .map((token) => (
                      <MenuItem
                        key={token.address}
                        value={token.address}
                        sx={{
                          pl: 3,
                          color: "#ffffff",
                          "&:hover": {
                            backgroundColor: "rgba(156, 39, 176, 0.1)",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "rgba(156, 39, 176, 0.2)",
                            "&:hover": {
                              backgroundColor: "rgba(156, 39, 176, 0.25)",
                            },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: token.isStablecoin
                                ? "rgba(76, 175, 80, 0.2)"
                                : token.isNativeWrapped
                                ? "rgba(33, 150, 243, 0.2)"
                                : "rgba(156, 39, 176, 0.2)",
                              color: token.isStablecoin
                                ? "#4caf50"
                                : token.isNativeWrapped
                                ? "#2196f3"
                                : "#ba68c8",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            {token.symbol.substring(0, 2)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: token.isStablecoin
                                  ? "#4caf50"
                                  : token.isNativeWrapped
                                  ? "#2196f3"
                                  : "#ba68c8",
                                fontWeight: 600,
                              }}
                            >
                              {token.symbol}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#9e9e9e", display: "block" }}
                            >
                              {token.name}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${token.decimals}d`}
                            size="small"
                            sx={{
                              bgcolor: "rgba(255, 255, 255, 0.1)",
                              color: "#ba68c8",
                              border: `1px solid rgba(255, 255, 255, 0.2)`,
                              fontSize: "0.6rem",
                              height: 18,
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Box>
              )
          )}

          {/* Custom Token Option */}
          <MenuItem
            value=""
            sx={{
              mt: 2,
              borderTop: "1px solid rgba(156, 39, 176, 0.2)",
              color: "#ffb74d",
              "&:hover": {
                backgroundColor: "rgba(255, 152, 0, 0.1)",
              },
              "&.Mui-selected": {
                backgroundColor: "rgba(255, 152, 0, 0.2)",
                "&:hover": {
                  backgroundColor: "rgba(255, 152, 0, 0.25)",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <SearchIcon sx={{ color: "#ffb74d" }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffb74d", fontWeight: 600 }}
                >
                  Custom Token
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#ffb74d", opacity: 0.8, display: "block" }}
                >
                  Enter custom ERC20 address
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {selectedToken && selectedToken.address && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="caption" sx={{ color: "#4dd0e1" }}>
            {selectedToken.symbol} • {selectedToken.name}
          </Typography>
          {selectedToken.isStablecoin && (
            <Chip
              label="Stablecoin"
              size="small"
              sx={{
                bgcolor: "rgba(76, 175, 80, 0.15)",
                color: "#81c784",
                border: `1px solid rgba(76, 175, 80, 0.4)`,
                fontSize: "0.6rem",
              }}
            />
          )}
          {selectedToken.isNativeWrapped && (
            <Chip
              label="Wrapped Native"
              size="small"
              sx={{
                bgcolor: "rgba(33, 150, 243, 0.15)",
                color: "#64b5f6",
                border: `1px solid rgba(33, 150, 243, 0.4)`,
                fontSize: "0.6rem",
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

// Enhanced Token Input with Dropdown
const EnhancedTokenInput: React.FC<{
  paymentTokenAddress: string;
  setPaymentTokenAddress: (value: string) => void;
  paymentTokenSymbol: string;
  setPaymentTokenSymbol: (value: string) => void;
  paymentTokenDecimals: number;
  setPaymentTokenDecimals: (value: number) => void;
  paymentTokenName: string;
  setPaymentTokenName: (value: string) => void;
  isTokenLoading: boolean;
  setIsTokenLoading: (value: boolean) => void;
  signer: ethers.Signer | null;
  showSnackbar: (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => void;
  networkInfo: NetworkInfo;
  disabled?: boolean;
}> = ({
  paymentTokenAddress,
  setPaymentTokenAddress,
  paymentTokenSymbol,
  setPaymentTokenSymbol,
  paymentTokenDecimals,
  setPaymentTokenDecimals,
  paymentTokenName,
  setPaymentTokenName,
  isTokenLoading,
  setIsTokenLoading,
  signer,
  showSnackbar,
  networkInfo,
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [showCustomInput, setShowCustomInput] = useState(false);

  // Fetch token info when payment token address changes
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (
        !paymentTokenAddress ||
        !ethers.isAddress(paymentTokenAddress) ||
        !signer
      ) {
        // Check if it's a known token from our list
        const knownToken = COMMON_ERC20_TOKENS.find(
          (token) =>
            token.address.toLowerCase() === paymentTokenAddress.toLowerCase()
        );

        if (knownToken) {
          setPaymentTokenSymbol(knownToken.symbol);
          setPaymentTokenDecimals(knownToken.decimals);
          setPaymentTokenName(knownToken.name);
          return;
        }

        // Reset to defaults
        setPaymentTokenSymbol("");
        setPaymentTokenDecimals(18);
        setPaymentTokenName("");
        return;
      }

      setIsTokenLoading(true);

      try {
        // Extended ERC20 ABI with more methods for better compatibility
        const tokenABI = [
          "function decimals() view returns (uint8)",
          "function symbol() view returns (string)",
          "function name() view returns (string)",
          // Some tokens might not have symbol() but have SYMBOL() or getSymbol()
          "function SYMBOL() view returns (string)",
          "function NAME() view returns (string)",
          "function getSymbol() view returns (string)",
          "function getName() view returns (string)",
        ];

        const tokenContract = new ethers.Contract(
          paymentTokenAddress,
          tokenABI,
          signer
        );

        let decimals = 18;
        let symbol = "";
        let name = "";

        // Try to get decimals with multiple fallbacks
        try {
          const decimalsResult = await tokenContract.decimals();
          decimals = Number(decimalsResult);
        } catch (decimalsError) {
          console.warn(
            "Could not fetch decimals, defaulting to 18:",
            decimalsError
          );
        }

        // Try to get symbol with multiple fallbacks
        try {
          // Try standard symbol()
          try {
            const symbolResult = await tokenContract.symbol();
            if (symbolResult && symbolResult.trim() !== "") {
              symbol = symbolResult;
            }
          } catch (e) {
            console.log("Standard symbol() failed, trying alternatives");
          }

          // Try SYMBOL() (some older tokens)
          if (!symbol) {
            try {
              const symbolResult = await tokenContract.SYMBOL();
              if (symbolResult && symbolResult.trim() !== "") {
                symbol = symbolResult;
              }
            } catch (e) {
              console.log("SYMBOL() failed");
            }
          }

          // Try getSymbol()
          if (!symbol) {
            try {
              const symbolResult = await tokenContract.getSymbol();
              if (symbolResult && symbolResult.trim() !== "") {
                symbol = symbolResult;
              }
            } catch (e) {
              console.log("getSymbol() failed");
            }
          }

          // If still no symbol, try name for display
          if (!symbol) {
            console.log("No symbol found, checking name...");
          }
        } catch (symbolError) {
          console.warn("Error fetching symbol:", symbolError);
        }

        // Try to get name with multiple fallbacks
        try {
          // Try standard name()
          try {
            const nameResult = await tokenContract.name();
            if (nameResult && nameResult.trim() !== "") {
              name = nameResult;
            }
          } catch (e) {
            console.log("Standard name() failed, trying alternatives");
          }

          // Try NAME() (some older tokens)
          if (!name) {
            try {
              const nameResult = await tokenContract.NAME();
              if (nameResult && nameResult.trim() !== "") {
                name = nameResult;
              }
            } catch (e) {
              console.log("NAME() failed");
            }
          }

          // Try getName()
          if (!name) {
            try {
              const nameResult = await tokenContract.getName();
              if (nameResult && nameResult.trim() !== "") {
                name = nameResult;
              }
            } catch (e) {
              console.log("getName() failed");
            }
          }
        } catch (nameError) {
          console.warn("Error fetching name:", nameError);
        }

        // Determine what to display as the token symbol
        let displaySymbol = symbol || name || "";

        if (!displaySymbol) {
          // Check if it's a known token by address
          const knownToken = COMMON_ERC20_TOKENS.find(
            (token) =>
              token.address.toLowerCase() === paymentTokenAddress.toLowerCase()
          );

          if (knownToken) {
            displaySymbol = knownToken.symbol;
            name = knownToken.name;
            decimals = knownToken.decimals;
          } else {
            // It's a custom token
            displaySymbol = "CUSTOM";
            name = "Custom Token";
          }
        }

        // If symbol is too long, truncate it
        if (displaySymbol.length > 12) {
          displaySymbol = displaySymbol.substring(0, 12) + "...";
        }

        setPaymentTokenDecimals(decimals);
        setPaymentTokenSymbol(displaySymbol);
        setPaymentTokenName(name);

        if (displaySymbol === "CUSTOM") {
          showSnackbar(
            "Custom token detected. Please verify the token details are correct.",
            "info"
          );
        } else if (displaySymbol) {
          showSnackbar(
            `Token detected: ${displaySymbol} (${decimals} decimals)`,
            "success"
          );
        }
      } catch (err) {
        console.error("Error fetching token info:", err);
        // Check if it's a known token
        const knownToken = COMMON_ERC20_TOKENS.find(
          (token) =>
            token.address.toLowerCase() === paymentTokenAddress.toLowerCase()
        );

        if (knownToken) {
          setPaymentTokenDecimals(knownToken.decimals);
          setPaymentTokenSymbol(knownToken.symbol);
          setPaymentTokenName(knownToken.name);
          showSnackbar(`Using known token: ${knownToken.symbol}`, "info");
        } else {
          // Set as custom token if we can't fetch info
          setPaymentTokenDecimals(18);
          setPaymentTokenSymbol("CUSTOM");
          setPaymentTokenName("Custom Token");
          showSnackbar(
            "Could not fetch token info. Using default values for custom token.",
            "warning"
          );
        }
      } finally {
        setIsTokenLoading(false);
      }
    };

    if (paymentTokenAddress && ethers.isAddress(paymentTokenAddress)) {
      fetchTokenInfo();
    } else {
      // Check if empty string (custom token selected)
      if (paymentTokenAddress === "") {
        setPaymentTokenSymbol("");
        setPaymentTokenDecimals(18);
        setPaymentTokenName("");
        setShowCustomInput(true);
      } else {
        // Reset to defaults
        setPaymentTokenSymbol("");
        setPaymentTokenDecimals(18);
        setPaymentTokenName("");
        setShowCustomInput(false);
      }
    }
  }, [paymentTokenAddress, signer]);

  const handleTokenSelect = (address: string) => {
    setPaymentTokenAddress(address);
    if (address === "") {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          component="div"
          gutterBottom
          color="#ba68c8"
        >
          Payment Token (ERC20) *
        </Typography>

        <TokenDropdown
          value={paymentTokenAddress}
          onChange={handleTokenSelect}
          disabled={disabled}
          networkInfo={networkInfo}
        />

        {showCustomInput && (
          <Box sx={{ mt: 2 }}>
            <CustomTextField
              fullWidth
              label="Custom Token Address *"
              value={paymentTokenAddress}
              onChange={(e) => setPaymentTokenAddress(e.target.value)}
              required
              helperText="Enter any ERC20 token contract address"
              placeholder="0x..."
              disabled={disabled}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    color="primary"
                    sx={{ mr: 1, color: "#ffb74d" }}
                  />
                ),
                style: { color: "#ffffff" },
              }}
              InputLabelProps={{
                style: { color: "#ba68c8" },
              }}
            />
          </Box>
        )}
      </Box>

      {paymentTokenAddress && ethers.isAddress(paymentTokenAddress) && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor:
              paymentTokenSymbol === "CUSTOM"
                ? "rgba(255, 152, 0, 0.15)"
                : paymentTokenSymbol
                ? "rgba(0, 188, 212, 0.15)"
                : "rgba(156, 39, 176, 0.15)",
            borderRadius: 2,
            border: `1px solid ${
              paymentTokenSymbol === "CUSTOM"
                ? "rgba(255, 152, 0, 0.4)"
                : paymentTokenSymbol
                ? "rgba(0, 188, 212, 0.4)"
                : "rgba(156, 39, 176, 0.4)"
            }`,
          }}
        >
          {isTokenLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} sx={{ color: "#ba68c8" }} />
              <Typography variant="body2" component="div" color="#ba68c8">
                Detecting token...
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{
                      color:
                        paymentTokenSymbol === "CUSTOM" ? "#ffb74d" : "#4dd0e1",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {paymentTokenSymbol === "CUSTOM" ? (
                      <>
                        <WarningIcon fontSize="small" />
                        Custom Token
                      </>
                    ) : (
                      <>
                        <TokenIcon fontSize="small" />
                        {paymentTokenSymbol}
                      </>
                    )}
                    {paymentTokenSymbol && paymentTokenSymbol !== "CUSTOM" && (
                      <Chip
                        label={`${paymentTokenDecimals} decimals`}
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: "rgba(156, 39, 176, 0.15)",
                          color: "#ba68c8",
                          border: `1px solid rgba(156, 39, 176, 0.4)`,
                          fontSize: "0.6rem",
                          height: 20,
                        }}
                      />
                    )}
                  </Typography>
                  {paymentTokenName && (
                    <Typography
                      variant="caption"
                      component="div"
                      color="#ba68c8"
                      sx={{ mt: 0.5 }}
                    >
                      {paymentTokenName}
                    </Typography>
                  )}
                </Box>

                <Tooltip title="Copy token address">
                  <IconButton
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentTokenAddress);
                      showSnackbar(
                        "Token address copied to clipboard",
                        "success"
                      );
                    }}
                    sx={{ color: "#ba68c8" }}
                  >
                    <LinkIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography
                variant="caption"
                component="div"
                sx={{
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  color: "#9e9e9e",
                  fontSize: "0.7rem",
                  mt: 1,
                }}
              >
                {paymentTokenAddress}
              </Typography>

              {paymentTokenSymbol === "CUSTOM" && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 1,
                    py: 0.5,
                    bgcolor: "rgba(255, 152, 0, 0.1)",
                    borderColor: "rgba(255, 152, 0, 0.3)",
                    "& .MuiAlert-icon": { color: "#ffb74d" },
                  }}
                >
                  <Typography variant="caption" component="div" color="#ffb74d">
                    Custom token - verify the address and decimals before
                    proceeding
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

// Fee Breakdown Component
const FeeBreakdown: React.FC<{ amount: number; tokenSymbol: string }> = ({
  amount,
  tokenSymbol,
}) => {
  const fee = calculateFee(amount);
  const net = calculateNetAmount(amount);

  return (
    <Box
      sx={{
        bgcolor: "rgba(76, 175, 80, 0.15)",
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "rgba(76, 175, 80, 0.4)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Typography
        variant="subtitle2"
        component="div"
        gutterBottom
        color="#81c784"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <CalculateIcon fontSize="small" />
        Fee Breakdown (1.5% per milestone)
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" component="div" color="#ba68c8">
              Total Amount:
            </Typography>
            <Typography
              variant="body2"
              component="div"
              fontWeight="bold"
              color="#81c784"
            >
              {formatLargeNumber(amount)} {tokenSymbol}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" component="div" color="#ba68c8">
              Platform Fee (1.5%):
            </Typography>
            <Typography variant="body2" component="div" color="#ba68c8">
              -{formatLargeNumber(fee)} {tokenSymbol}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ my: 0.5, bgcolor: "rgba(76, 175, 80, 0.2)" }} />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant="body2"
              component="div"
              fontWeight="bold"
              color="#81c784"
            >
              Net to Developer:
            </Typography>
            <Typography
              variant="body2"
              component="div"
              fontWeight="bold"
              color="#81c784"
            >
              {formatLargeNumber(net)} {tokenSymbol}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Custom TextField Component with visible text
const CustomTextField: React.FC<any> = ({ sx, ...props }) => {
  return (
    <TextField
      sx={{
        "& .MuiInputLabel-root": {
          color: "#ba68c8 !important",
          "&.Mui-focused": {
            color: "#9c27b0 !important",
          },
        },
        "& .MuiOutlinedInput-root": {
          "& input": {
            color: "#ffffff !important",
          },
          "& textarea": {
            color: "#ffffff !important",
          },
          "& fieldset": {
            borderColor: "rgba(156, 39, 176, 0.4) !important",
          },
          "&:hover fieldset": {
            borderColor: "rgba(156, 39, 176, 0.6) !important",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#9c27b0 !important",
          },
        },
        "& .MuiFormHelperText-root": {
          color: "#ba68c8 !important",
        },
        ...sx,
      }}
      {...props}
    />
  );
};

// Gas Fee Warning Component
const GasFeeWarning: React.FC<{
  title: string;
  onClose?: () => void;
  networkInfo: NetworkInfo;
  paymentTokenSymbol?: string;
}> = ({ title, onClose, networkInfo, paymentTokenSymbol = "tokens" }) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "rgba(255, 152, 0, 0.15)",
          color: "#ffb74d",
          borderBottom: `1px solid rgba(255, 152, 0, 0.4)`,
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GasMeterIcon />
          <Typography variant="h6" component="div" fontWeight="bold">
            Gas Fee Warning
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            bgcolor: "rgba(255, 152, 0, 0.15)",
            borderColor: "rgba(255, 152, 0, 0.4)",
          }}
        >
          <Typography
            variant="body2"
            component="div"
            fontWeight="bold"
            color="#ffb74d"
          >
            ⚠️ This action requires significant gas fees
          </Typography>
        </Alert>

        <Typography
          variant="body1"
          component="div"
          gutterBottom
          color="text.primary"
        >
          You are about to deploy:{" "}
          <strong style={{ color: "#ffb74d" }}>{title}</strong>
        </Typography>

        <Box
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.3)",
            p: 2,
            borderRadius: 2,
            mt: 2,
            mb: 2,
            border: `1px solid rgba(255, 255, 255, 0.12)`,
          }}
        >
          <Typography
            variant="subtitle2"
            component="div"
            gutterBottom
            color="#ba68c8"
          >
            Gas fees will be required for:
          </Typography>
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="1. Contract Deployment"
                secondary="Permanent smart contract creation on blockchain"
                primaryTypographyProps={{ component: "div", color: "#ffb74d" }}
                secondaryTypographyProps={{
                  component: "div",
                  color: "#ba68c8",
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="2. Registry Registration"
                secondary="Registering project with OpenForge registry"
                primaryTypographyProps={{ component: "div", color: "#ffb74d" }}
                secondaryTypographyProps={{
                  component: "div",
                  color: "#ba68c8",
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="3. Token Approval"
                secondary={`Approving ${paymentTokenSymbol} transfer to escrow contract`}
                primaryTypographyProps={{ component: "div", color: "#ffb74d" }}
                secondaryTypographyProps={{
                  component: "div",
                  color: "#ba68c8",
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="4. Initial Funding"
                secondary={`Transferring ${paymentTokenSymbol} to escrow contract`}
                primaryTypographyProps={{ component: "div", color: "#ffb74d" }}
                secondaryTypographyProps={{
                  component: "div",
                  color: "#ba68c8",
                }}
              />
            </ListItem>
          </List>
        </Box>

        <Alert
          severity="error"
          sx={{
            mt: 2,
            bgcolor: "rgba(244, 67, 54, 0.15)",
            borderColor: "rgba(244, 67, 54, 0.4)",
          }}
        >
          <Typography variant="body2" component="div" color="#e57373">
            <strong>⚠️ IMPORTANT:</strong> This contract will be PERMANENT on
            the blockchain. Once deployed, it cannot be modified or deleted.
            Please verify all details carefully.
          </Typography>
        </Alert>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "rgba(33, 150, 243, 0.15)",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "rgba(33, 150, 243, 0.4)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography variant="body2" component="div" color="#64b5f6">
            <InfoIcon
              fontSize="small"
              sx={{ verticalAlign: "middle", mr: 1, color: "#64b5f6" }}
            />
            Make sure you have enough {networkInfo.nativeToken} in your wallet
            for gas fees (typically 0.01-0.05 {networkInfo.nativeToken} on{" "}
            {networkInfo.isTestnet ? "testnet" : "mainnet"})
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderColor: "rgba(255, 255, 255, 0.3)", color: "#ba68c8" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#ff9800",
            background: "linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)",
            "&:hover": {
              bgcolor: "#f57c00",
              background: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
            },
          }}
        >
          I Understand, Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MilestonesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for deploy form
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [developerAddress, setDeveloperAddress] = useState("");
  const [paymentTokenAddress, setPaymentTokenAddress] = useState("");
  const [paymentTokenSymbol, setPaymentTokenSymbol] = useState<string>("");
  const [paymentTokenDecimals, setPaymentTokenDecimals] = useState<number>(18);
  const [paymentTokenName, setPaymentTokenName] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { amount: "", deadline: null, description: "" },
  ]);

  // State for deployed contracts
  const [deployedContracts, setDeployedContracts] = useState<
    DeployedContract[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [viewFilter, setViewFilter] = useState<"all" | "funder" | "developer">(
    "all"
  );
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    chainId: 11155111,
    name: "Sepolia",
    nativeToken: "SepoliaETH",
    explorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  });
  const [showGasWarning, setShowGasWarning] = useState(false);
  const [deploymentConfirmed, setDeploymentConfirmed] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [selectedTokenInfo, setSelectedTokenInfo] = useState<ERC20Token | null>(
    null
  );

  // Get all unique addresses from contracts for batch profile fetching
  const allAddresses = useMemo(() => {
    const addresses = new Set<string>();
    deployedContracts.forEach((contract) => {
      addresses.add(contract.funder.toLowerCase());
      addresses.add(contract.developer.toLowerCase());
    });
    if (userAddress) {
      addresses.add(userAddress.toLowerCase());
    }
    if (developerAddress) {
      addresses.add(developerAddress.toLowerCase());
    }
    return Array.from(addresses);
  }, [deployedContracts, userAddress, developerAddress]);

  // Fetch profiles for all addresses
  const { profiles, loading: profilesLoading } = useProfiles(allAddresses);

  // Load URL parameters when component mounts
  useEffect(() => {
    if (!urlParamsLoaded && typeof window !== "undefined") {
      const params = parseURLParams();

      console.log("URL Parameters loaded:", params);

      // Set form fields from URL parameters
      if (params.title) {
        setProjectTitle(params.title);
      }

      if (params.description) {
        setProjectDescription(params.description);
      }

      if (params.tags) {
        const tagsArray = parseTagsFromURL(params.tags);
        setProjectTags(tagsArray);
      }

      if (params.developerAddress) {
        setDeveloperAddress(params.developerAddress);
      }

      if (params.paymentTokenAddress) {
        setPaymentTokenAddress(params.paymentTokenAddress);
        // Check if it's a known token
        const knownToken = COMMON_ERC20_TOKENS.find(
          (token) =>
            token.address.toLowerCase() ===
            params.paymentTokenAddress?.toLowerCase()
        );
        if (knownToken) {
          setSelectedTokenInfo(knownToken);
          setPaymentTokenSymbol(knownToken.symbol);
          setPaymentTokenDecimals(knownToken.decimals);
          setPaymentTokenName(knownToken.name);
        }
      }

      if (params.milestones) {
        const parsedMilestones = parseMilestonesFromURL(params.milestones);
        setMilestones(parsedMilestones);
      }

      // If there are URL parameters, switch to deploy tab
      if (
        params.title ||
        params.description ||
        params.tags ||
        params.developerAddress ||
        params.milestones
      ) {
        setActiveTab(0);
        setActiveStep(0);
        showSnackbar(
          "Form pre-filled from URL parameters. Review and continue.",
          "info"
        );
      }

      // Check action parameter
      if (params.action === "deploy") {
        setActiveTab(0);
        showSnackbar("Ready to deploy a new contract", "info");
      }

      setUrlParamsLoaded(true);
    }
  }, [urlParamsLoaded]);

  // Initialize provider and signer
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();

          const network = await provider.getNetwork();
          const netInfo = getNetworkInfo(network.chainId);
          setNetworkInfo(netInfo);

          setSigner(signer);
          setUserAddress(address);
          fetchUserContracts(address);

          window.ethereum.on("accountsChanged", async (accounts: string[]) => {
            if (accounts.length > 0) {
              const newProvider = new ethers.BrowserProvider(window.ethereum);
              const newSigner = await newProvider.getSigner();
              const newNetwork = await newProvider.getNetwork();
              const newNetInfo = getNetworkInfo(newNetwork.chainId);
              setNetworkInfo(newNetInfo);
              setSigner(newSigner);
              setUserAddress(accounts[0]);
              fetchUserContracts(accounts[0]);
            } else {
              setUserAddress("");
              setSigner(null);
              setDeployedContracts([]);
            }
          });

          window.ethereum.on("chainChanged", async () => {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const newSigner = await newProvider.getSigner();
            const newAddress = await newSigner.getAddress();
            const newNetwork = await newProvider.getNetwork();
            const newNetInfo = getNetworkInfo(newNetwork.chainId);
            setNetworkInfo(newNetInfo);
            setSigner(newSigner);
            setUserAddress(newAddress);
            fetchUserContracts(newAddress);
          });
        } catch (err) {
          console.error("Error connecting wallet:", err);
          showSnackbar(
            "Failed to connect wallet. Please make sure MetaMask is installed and unlocked.",
            "error"
          );
        }
      } else {
        showSnackbar(
          "MetaMask not detected. Please install MetaMask to use this application.",
          "error"
        );
      }
    };

    init();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const toggleExpandContract = (escrowAddress: string) => {
    setExpandedContract(
      expandedContract === escrowAddress ? null : escrowAddress
    );
  };

  // Fetch user's contracts from registry
  const fetchUserContracts = async (address: string) => {
    if (!signer) {
      console.log("No signer available");
      return;
    }

    console.log(`Fetching contracts for address: ${address}`);
    setLoadingContracts(true);

    try {
      const registry = new ethers.Contract(
        REGISTRY_ADDRESS,
        OpenForgeProjectRegistryABI,
        signer
      );

      console.log("Registry contract initialized");

      const projectIds = await registry.getUserProjects(address);
      console.log(`Found ${projectIds.length} project IDs:`, projectIds);

      const contracts: DeployedContract[] = [];

      for (let i = 0; i < projectIds.length; i++) {
        const projectId = projectIds[i];
        console.log(
          `Processing project ${i + 1}/${projectIds.length}: ID ${projectId}`
        );

        try {
          const project = await registry.getProject(projectId);
          console.log(`Project ${projectId} data:`, project);

          if (project.escrowAddress === ethers.ZeroAddress) {
            console.log(`Skipping project ${projectId} - no escrow address`);
            continue;
          }

          const escrow = new ethers.Contract(
            project.escrowAddress,
            SimpleMilestoneEscrowABI,
            signer
          );

          console.log(
            `Escrow contract initialized at ${project.escrowAddress}`
          );

          const [
            funder,
            developer,
            status,
            totalAmount,
            releasedAmount,
            paymentToken,
            milestoneCount,
            disputeReason,
          ] = await Promise.all([
            escrow.funder(),
            escrow.developer(),
            escrow.getStatus(),
            escrow.totalAmount(),
            escrow.releasedAmount(),
            escrow.paymentToken(),
            escrow.milestoneCount(),
            escrow.disputeReason
              ? escrow.disputeReason().catch(() => "")
              : Promise.resolve(""),
          ]);

          console.log(`Escrow details for project ${projectId}:`, {
            funder,
            developer,
            status,
            milestoneCount,
          });

          const userRole = project.funder === address ? "funder" : "developer";
          console.log(`User ${address} is ${userRole} in project ${projectId}`);

          let tokenSymbol = "Token";
          let tokenDecimals = 18;
          let tokenName = "Token";

          try {
            // Extended token ABI for better compatibility
            const tokenABI = [
              "function decimals() view returns (uint8)",
              "function symbol() view returns (string)",
              "function name() view returns (string)",
              "function SYMBOL() view returns (string)",
              "function NAME() view returns (string)",
            ];

            const tokenContract = new ethers.Contract(
              paymentToken,
              tokenABI,
              signer
            );

            let decimals = 18;
            let symbol = "";
            let name = "";

            // Try to get decimals
            try {
              const decimalsResult = await tokenContract.decimals();
              decimals = Number(decimalsResult);
            } catch (e) {
              console.warn(
                `Could not fetch decimals for token ${paymentToken}:`,
                e
              );
            }

            // Try to get symbol
            try {
              const symbolResult = await tokenContract.symbol();
              if (symbolResult && symbolResult.trim() !== "") {
                symbol = symbolResult;
              }
            } catch (e) {
              console.log(
                `Standard symbol() failed for ${paymentToken}, trying alternatives`
              );
              try {
                const symbolResult = await tokenContract.SYMBOL();
                if (symbolResult && symbolResult.trim() !== "") {
                  symbol = symbolResult;
                }
              } catch (e2) {
                console.log(`SYMBOL() also failed for ${paymentToken}`);
              }
            }

            // Try to get name
            try {
              const nameResult = await tokenContract.name();
              if (nameResult && nameResult.trim() !== "") {
                name = nameResult;
              }
            } catch (e) {
              console.log(
                `Standard name() failed for ${paymentToken}, trying alternatives`
              );
              try {
                const nameResult = await tokenContract.NAME();
                if (nameResult && nameResult.trim() !== "") {
                  name = nameResult;
                }
              } catch (e2) {
                console.log(`NAME() also failed for ${paymentToken}`);
              }
            }

            // Determine display symbol
            if (symbol) {
              tokenSymbol = symbol;
            } else if (name) {
              tokenSymbol = name;
            } else {
              // Check if it's a known token
              const knownToken = COMMON_ERC20_TOKENS.find(
                (t) => t.address.toLowerCase() === paymentToken.toLowerCase()
              );
              if (knownToken) {
                tokenSymbol = knownToken.symbol;
                tokenName = knownToken.name;
                decimals = knownToken.decimals;
              } else {
                tokenSymbol = "CUSTOM";
                tokenName = "Custom Token";
              }
            }

            tokenDecimals = decimals;
            tokenName = name || tokenSymbol;
          } catch (err) {
            console.error(
              `Error fetching token info for ${paymentToken}:`,
              err
            );
          }

          const milestoneList: Milestone[] = [];
          const now = Math.floor(Date.now() / 1000);

          for (let j = 0; j < milestoneCount; j++) {
            try {
              const milestone = await escrow.milestones(j);
              const deadline = Number(milestone.deadline);
              const isOverdue =
                deadline > 0 &&
                deadline < now &&
                !milestone.released &&
                !milestone.cancelled;

              const canRelease =
                userRole === "funder" &&
                !milestone.released &&
                !milestone.cancelled &&
                status === "Funded (Active)";

              const canCancel =
                userRole === "funder" &&
                isOverdue &&
                !milestone.released &&
                !milestone.cancelled &&
                status === "Funded (Active)";

              milestoneList.push({
                amount: milestone.amount.toString(),
                released: milestone.released,
                cancelled: milestone.cancelled,
                deadline: milestone.deadline.toString(),
                description: milestone.description,
                canRelease,
                canCancel,
                isOverdue,
              });
            } catch (err) {
              console.error(
                `Error fetching milestone ${j} for project ${projectId}:`,
                err
              );
            }
          }

          const totalAmountFormatted = ethers.formatUnits(
            totalAmount,
            tokenDecimals
          );
          const releasedAmountFormatted = ethers.formatUnits(
            releasedAmount,
            tokenDecimals
          );

          const contract: DeployedContract = {
            projectId: Number(projectId),
            escrowAddress: project.escrowAddress,
            title: project.title || `Project ${projectId}`,
            description: project.description || "No description provided",
            funder: project.funder,
            developer: project.developer,
            status: status,
            totalAmount: totalAmountFormatted,
            releasedAmount: releasedAmountFormatted,
            paymentToken: paymentToken,
            paymentTokenSymbol: tokenSymbol,
            paymentTokenDecimals: tokenDecimals,
            active: project.active,
            milestones: milestoneList,
            userRole: userRole,
            creationDate: project.creationDate
              ? new Date(
                  Number(project.creationDate) * 1000
                ).toLocaleDateString()
              : undefined,
            disputeReason: disputeReason || undefined,
          };

          contracts.push(contract);
          console.log(`Successfully loaded project ${projectId}:`, contract);
        } catch (err) {
          console.error(`Error processing project ${projectId}:`, err);
        }
      }

      contracts.sort((a, b) => b.projectId - a.projectId);

      console.log(
        `Final contracts array (${contracts.length} contracts):`,
        contracts
      );
      setDeployedContracts(contracts);

      if (contracts.length === 0) {
        showSnackbar(
          "No active contracts found. You can deploy a new one!",
          "info"
        );
      } else {
        showSnackbar(
          `Successfully loaded ${contracts.length} contract(s)`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      const errorMessage =
        err.reason || err.message || "Failed to fetch contracts";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoadingContracts(false);
    }
  };

  // Form handlers
  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { amount: "", deadline: null, description: "" },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length > 1) {
      const newMilestones = [...milestones];
      newMilestones.splice(index, 1);
      setMilestones(newMilestones);
    }
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneInput,
    value: any
  ) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const handleAddTag = () => {
    if (currentTag && !projectTags.includes(currentTag)) {
      setProjectTags([...projectTags, currentTag]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setProjectTags(projectTags.filter((t) => t !== tag));
  };

  // Validate milestone amounts
  const validateMilestoneAmounts = () => {
    for (let i = 0; i < milestones.length; i++) {
      const amount = parseFloat(milestones[i].amount);
      if (isNaN(amount)) {
        return {
          valid: false,
          error: `Milestone ${i + 1}: Please enter a valid number`,
        };
      }
      if (amount <= 0) {
        return {
          valid: false,
          error: `Milestone ${i + 1}: Amount must be greater than 0`,
        };
      }
      if (amount > 1e12) {
        // Trillion limit
        return {
          valid: false,
          error: `Milestone ${i + 1}: Amount cannot exceed 1 trillion tokens`,
        };
      }
    }
    return { valid: true, error: null };
  };

  // Generate shareable URL for current form state
  const generateShareableURL = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    if (projectTitle) params.append("title", encodeURIComponent(projectTitle));
    if (projectDescription)
      params.append("description", encodeURIComponent(projectDescription));
    if (projectTags.length > 0) params.append("tags", projectTags.join(","));
    if (developerAddress) params.append("developer", developerAddress);
    if (paymentTokenAddress) params.append("paymentToken", paymentTokenAddress);

    // Encode milestones (format: amount1:description1|amount2:description2)
    const milestoneStrings = milestones
      .filter((m) => m.amount && m.description)
      .map((m) => `${m.amount}:${encodeURIComponent(m.description)}`);

    if (milestoneStrings.length > 0) {
      params.append("milestones", milestoneStrings.join("|"));
    }

    // Add action parameter if not already present
    if (!window.location.search.includes("action=")) {
      params.append("action", "deploy");
    }

    const url = `${baseUrl}?${params.toString()}`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showSnackbar("Shareable URL copied to clipboard!", "success");
      })
      .catch(() => {
        showSnackbar("Failed to copy URL to clipboard", "error");
      });

    return url;
  };

  // Show deployment confirmation dialog
  const showDeploymentConfirmation = async () => {
    if (!signer) {
      showSnackbar("Please connect your wallet first", "error");
      return;
    }

    // Validate inputs
    if (!developerAddress || !ethers.isAddress(developerAddress)) {
      showSnackbar("Please enter a valid developer address", "error");
      return;
    }

    if (!paymentTokenAddress || !ethers.isAddress(paymentTokenAddress)) {
      showSnackbar("Please enter a valid payment token address", "error");
      return;
    }

    if (!projectTitle.trim()) {
      showSnackbar("Please enter a project title", "error");
      return;
    }

    const validation = validateMilestoneAmounts();
    if (!validation.valid) {
      showSnackbar(validation.error!, "error");
      return;
    }

    try {
      // Get token info with extended ABI
      const tokenABI = [
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function SYMBOL() view returns (string)",
        "function NAME() view returns (string)",
        "function balanceOf(address owner) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
      ];

      const tokenContract = new ethers.Contract(
        paymentTokenAddress,
        tokenABI,
        signer
      );

      // Get decimals with fallback
      let decimals = paymentTokenDecimals;
      try {
        const decimalsResult = await tokenContract.decimals();
        decimals = Number(decimalsResult);
      } catch (e) {
        console.warn("Could not fetch decimals, using known value:", e);
      }

      // Get symbol with fallbacks
      let symbol = paymentTokenSymbol;
      try {
        const symbolResult = await tokenContract.symbol();
        if (symbolResult && symbolResult.trim() !== "") {
          symbol = symbolResult;
        }
      } catch (e) {
        console.log("Standard symbol() failed, trying alternatives");
        try {
          const symbolResult = await tokenContract.SYMBOL();
          if (symbolResult && symbolResult.trim() !== "") {
            symbol = symbolResult;
          }
        } catch (e2) {
          console.log("SYMBOL() also failed");
        }
      }

      // If still no symbol, use the one from state or default
      if (!symbol || symbol.trim() === "") {
        symbol = paymentTokenSymbol || "CUSTOM";
      }

      // Calculate totals
      let totalAmount = 0;
      const milestoneDetails = milestones.map((milestone, index) => {
        const amount = parseFloat(milestone.amount);
        totalAmount += amount;
        const fee = calculateFee(amount);
        const net = calculateNetAmount(amount);
        return {
          number: index + 1,
          amount,
          fee,
          net,
          description: milestone.description,
          deadline: milestone.deadline?.format("MMM DD, YYYY") || "No deadline",
        };
      });

      const totalFee = calculateFee(totalAmount);
      const totalNet = calculateNetAmount(totalAmount);

      // Prepare deployment data
      const data = {
        projectTitle,
        developerAddress,
        developerProfile: profiles[developerAddress.toLowerCase()],
        paymentTokenSymbol: symbol,
        paymentTokenDecimals: decimals,
        totalAmount,
        totalFee,
        totalNet,
        milestoneDetails,
        milestonesCount: milestones.length,
        userAddress,
      };

      setDeploymentData(data);
      setConfirmDialogOpen(true);
    } catch (err: any) {
      console.error("Error preparing deployment:", err);
      showSnackbar("Failed to prepare deployment details", "error");
    }
  };

  // Handle actual deployment after confirmation
  const handleDeployContract = async () => {
    if (!deploymentData || !signer) {
      showSnackbar("Deployment data not available", "error");
      return;
    }

    setLoading(true);
    setConfirmDialogOpen(false);
    setShowGasWarning(false);

    try {
      const { paymentTokenSymbol, paymentTokenDecimals, totalAmount } =
        deploymentData;

      const tokenABI = [
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function balanceOf(address owner) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
      ];

      const tokenContract = new ethers.Contract(
        paymentTokenAddress,
        tokenABI,
        signer
      );

      // Prepare milestone data for contract
      const milestoneAmounts: bigint[] = [];
      const milestoneDeadlines: number[] = [];
      const milestoneDescriptions: string[] = [];

      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        milestoneAmounts.push(
          ethers.parseUnits(milestone.amount, paymentTokenDecimals)
        );
        milestoneDeadlines.push(
          milestone.deadline
            ? Math.floor(milestone.deadline.valueOf() / 1000)
            : 0
        );
        milestoneDescriptions.push(milestone.description);
      }

      const totalContractAmount = milestoneAmounts.reduce(
        (sum, amount) => sum + amount,
        BigInt(0)
      );

      // Check token balance
      const userAddress = await signer.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);
      if (balance < totalContractAmount) {
        const balanceDisplay = ethers.formatUnits(
          balance,
          paymentTokenDecimals
        );
        const neededDisplay = ethers.formatUnits(
          totalContractAmount,
          paymentTokenDecimals
        );
        throw new Error(
          `Insufficient ${paymentTokenSymbol} balance. You have ${formatLargeNumber(
            parseFloat(balanceDisplay)
          )} ${paymentTokenSymbol}, but need ${formatLargeNumber(
            parseFloat(neededDisplay)
          )} ${paymentTokenSymbol}`
        );
      }

      showSnackbar("Deploying escrow contract...", "info");

      const factory = new ethers.ContractFactory(
        SimpleMilestoneEscrowABI,
        SimpleMilestoneEscrowBytecode,
        signer
      );

      const escrowContract = await factory.deploy(
        userAddress,
        developerAddress,
        paymentTokenAddress,
        milestoneAmounts,
        milestoneDeadlines,
        milestoneDescriptions
      );

      showSnackbar("Waiting for contract deployment confirmation...", "info");
      const deploymentReceipt = await escrowContract.waitForDeployment();
      const escrowAddress = await escrowContract.getAddress();

      showSnackbar(`Escrow contract deployed at: ${escrowAddress}`, "success");

      showSnackbar("Registering project with registry...", "info");

      const registry = new ethers.Contract(
        REGISTRY_ADDRESS,
        OpenForgeProjectRegistryABI,
        signer
      );

      const registerTx = await registry.registerProject(
        escrowAddress,
        projectTitle,
        projectDescription,
        projectTags
      );

      await registerTx.wait();

      let projectId = "Unknown";
      if (deploymentReceipt.logs) {
        try {
          const eventLog = deploymentReceipt.logs.find(
            (log: any) =>
              log.topics[0] ===
              ethers.id(
                "ProjectRegistered(uint256,address,address,address,string)"
              )
          );
          if (eventLog) {
            const parsedLog = registry.interface.parseLog({
              topics: eventLog.topics,
              data: eventLog.data,
            });
            projectId = parsedLog?.args.projectId.toString() || "Unknown";
          }
        } catch (err) {
          console.error("Error parsing event logs:", err);
        }
      }

      showSnackbar(`Project registered with ID: ${projectId}`, "success");

      showSnackbar(`Approving token transfer...`, "info");

      const approveTx = await tokenContract.approve(
        escrowAddress,
        totalContractAmount
      );
      await approveTx.wait();

      showSnackbar("Token transfer approved. Funding escrow...", "info");

      const fundTx = await escrowContract.fund();
      await fundTx.wait();

      showSnackbar("Escrow funded successfully!", "success");

      // Reset form
      setMilestones([{ amount: "", deadline: null, description: "" }]);
      setProjectTitle("");
      setProjectDescription("");
      setProjectTags([]);
      setDeveloperAddress("");
      setPaymentTokenAddress("");
      setPaymentTokenSymbol("");
      setPaymentTokenDecimals(18);
      setPaymentTokenName("");
      setSelectedTokenInfo(null);
      setActiveStep(0);
      setActiveTab(1);

      fetchUserContracts(userAddress);

      const totalDisplay = ethers.formatUnits(
        totalContractAmount,
        paymentTokenDecimals
      );
      showSnackbar(
        `Contract deployed and funded successfully! Total: ${formatLargeNumber(
          parseFloat(totalDisplay)
        )} ${paymentTokenSymbol}`,
        "success"
      );
    } catch (err: any) {
      console.error("Deployment error:", err);
      const errorMessage =
        err.reason || err.message || "Failed to deploy contract";
      showSnackbar(errorMessage, "error");
      setError(errorMessage);
    } finally {
      setLoading(false);
      setDeploymentData(null);
    }
  };

  // Contract interaction functions
  const handleReleaseMilestone = async (
    escrowAddress: string,
    index: number
  ) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.releaseMilestone(index);
      showSnackbar("Releasing milestone...", "info");
      await tx.wait();

      showSnackbar(`Milestone ${index + 1} released successfully`, "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to release milestone";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleCancelMilestone = async (
    escrowAddress: string,
    index: number
  ) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.cancelMilestone(index);
      showSnackbar("Cancelling milestone...", "info");
      await tx.wait();

      showSnackbar(`Milestone ${index + 1} cancelled successfully`, "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to cancel milestone";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleCancelProject = async (escrowAddress: string) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.cancelProject();
      showSnackbar("Cancelling project...", "info");
      await tx.wait();

      showSnackbar("Project cancelled successfully", "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to cancel project";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleRaiseDispute = async (escrowAddress: string) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    const reason = window.prompt("Please enter the reason for the dispute:");
    if (!reason || reason.trim() === "") {
      showSnackbar("Dispute reason cannot be empty", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.raiseDispute(reason);
      showSnackbar("Raising dispute...", "info");
      await tx.wait();

      showSnackbar("Dispute raised successfully", "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to raise dispute";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleResolveDisputeToDeveloper = async (escrowAddress: string) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.resolveDisputeToDeveloper();
      showSnackbar("Resolving dispute to developer...", "info");
      await tx.wait();

      showSnackbar("Dispute resolved in favor of developer", "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to resolve dispute";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleResolveDisputeToFunder = async (escrowAddress: string) => {
    if (!signer) {
      showSnackbar("Please connect your wallet", "error");
      return;
    }

    try {
      const escrow = new ethers.Contract(
        escrowAddress,
        SimpleMilestoneEscrowABI,
        signer
      );

      const tx = await escrow.resolveDisputeToFunder();
      showSnackbar("Resolving dispute to funder...", "info");
      await tx.wait();

      showSnackbar("Dispute resolved in favor of funder", "success");
      fetchUserContracts(userAddress);
    } catch (err: any) {
      const errorMessage =
        err.reason || err.message || "Failed to resolve dispute";
      showSnackbar(errorMessage, "error");
    }
  };

  const steps = ["Project Details", "Milestones", "Review & Deploy"];

  const getStepContent = (step: number) => {
    const displayTokenSymbol = paymentTokenSymbol || "Token";

    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity="info"
              sx={{
                mb: 3,
                bgcolor: "rgba(156, 39, 176, 0.15)",
                borderColor: "rgba(156, 39, 176, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="body2" component="div" color="#ba68c8">
                Enter basic project information. The project will be
                automatically registered with a unique ID.
              </Typography>
            </Alert>

            <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={generateShareableURL}
                startIcon={<LinkIcon fontSize="small" />}
                sx={{
                  borderColor: "rgba(156, 39, 176, 0.4)",
                  color: "#ba68c8",
                  "&:hover": {
                    borderColor: "#9c27b0",
                  },
                }}
              >
                Copy Shareable URL
              </Button>
            </Box>

            <CustomTextField
              fullWidth
              label="Project Title *"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              margin="normal"
              required
              helperText="Give your project a descriptive title"
              InputLabelProps={{
                style: { color: "#ba68c8" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <CustomTextField
              fullWidth
              label="Project Description *"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              required
              helperText="Describe what this project is about"
              InputLabelProps={{
                style: { color: "#ba68c8" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="subtitle2"
                component="div"
                gutterBottom
                color="#ba68c8"
              >
                Project Tags
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 2,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <CustomTextField
                  label="Add Tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  size="small"
                  fullWidth
                  helperText="Press Enter or click Add to add tags"
                  InputLabelProps={{
                    style: { color: "#ba68c8" },
                  }}
                  InputProps={{
                    style: { color: "#ffffff" },
                  }}
                />
                <Button
                  onClick={handleAddTag}
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(156, 39, 176, 0.4)",
                    color: "#ba68c8",
                    mt: isMobile ? 1 : 0,
                    "&:hover": {
                      borderColor: "#9c27b0",
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {projectTags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      bgcolor: "rgba(156, 39, 176, 0.15)",
                      color: "#ba68c8",
                      borderColor: "rgba(156, 39, 176, 0.4)",
                      "& .MuiChip-deleteIcon": {
                        color: "#ba68c8",
                        "&:hover": {
                          color: "#ffffff",
                        },
                      },
                    }}
                    variant="outlined"
                  />
                ))}
                {projectTags.length === 0 && (
                  <Typography variant="caption" color="#ba68c8">
                    No tags added yet
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 1:
        const totalAmount = milestones.reduce(
          (sum, m) => sum + (parseFloat(m.amount) || 0),
          0
        );

        return (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity="info"
              sx={{
                mb: 3,
                bgcolor: "rgba(156, 39, 176, 0.15)",
                borderColor: "rgba(156, 39, 176, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography variant="body2" component="div" color="#ba68c8">
                Enter contract details and milestones. Each milestone release
                incurs a 1.5% platform fee.
              </Typography>
            </Alert>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label="Developer Address *"
                  value={developerAddress}
                  onChange={(e) => setDeveloperAddress(e.target.value)}
                  required
                  helperText="The developer who will receive milestone payments"
                  placeholder="0x..."
                  InputProps={{
                    startAdornment: (
                      <PersonIcon
                        color="primary"
                        sx={{ mr: 1, color: "#ba68c8" }}
                      />
                    ),
                    style: { color: "#ffffff" },
                  }}
                  InputLabelProps={{
                    style: { color: "#ba68c8" },
                  }}
                />
                {developerAddress && (
                  <Box sx={{ mt: 1 }}>
                    <AddressWithProfile
                      address={developerAddress}
                      profile={profiles[developerAddress.toLowerCase()]}
                    />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <EnhancedTokenInput
                  paymentTokenAddress={paymentTokenAddress}
                  setPaymentTokenAddress={setPaymentTokenAddress}
                  paymentTokenSymbol={paymentTokenSymbol}
                  setPaymentTokenSymbol={setPaymentTokenSymbol}
                  paymentTokenDecimals={paymentTokenDecimals}
                  setPaymentTokenDecimals={setPaymentTokenDecimals}
                  paymentTokenName={paymentTokenName}
                  setPaymentTokenName={setPaymentTokenName}
                  isTokenLoading={isTokenLoading}
                  setIsTokenLoading={setIsTokenLoading}
                  signer={signer}
                  showSnackbar={showSnackbar}
                  networkInfo={networkInfo}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 3,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 2 : 0,
              }}
            >
              <Typography variant="h6" component="div" color="#ba68c8">
                <TimelineIcon
                  sx={{ verticalAlign: "middle", mr: 1, color: "#ba68c8" }}
                />
                Milestones
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "rgba(156, 39, 176, 0.4)",
                  color: "#ba68c8",
                  "&:hover": {
                    borderColor: "#9c27b0",
                  },
                }}
              >
                Add Milestone
              </Button>
            </Box>

            {milestones.map((milestone, index) => {
              const amount = parseFloat(milestone.amount) || 0;
              const fee = calculateFee(amount);
              const net = calculateNetAmount(amount);

              return (
                <Card
                  key={index}
                  sx={{
                    mb: 2,
                    border: "1px solid",
                    borderColor:
                      index % 2 === 0
                        ? "rgba(156, 39, 176, 0.2)"
                        : "rgba(0, 188, 212, 0.2)",
                    bgcolor:
                      index % 2 === 0
                        ? "rgba(156, 39, 176, 0.08)"
                        : "rgba(0, 188, 212, 0.08)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 1 : 0,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: index % 2 === 0 ? "#7b1fa2" : "#00838f",
                            width: 28,
                            height: 28,
                            fontWeight: "bold",
                            boxShadow: `0 0 10px ${
                              index % 2 === 0
                                ? "rgba(156, 39, 176, 0.3)"
                                : "rgba(0, 188, 212, 0.3)"
                            }`,
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <Typography
                          variant="h6"
                          component="div"
                          color={index % 2 === 0 ? "#ba68c8" : "#4dd0e1"}
                        >
                          Milestone {index + 1}
                        </Typography>
                      </Box>
                      {milestones.length > 1 && (
                        <Tooltip title="Remove milestone">
                          <IconButton
                            onClick={() => handleRemoveMilestone(index)}
                            size="small"
                            sx={{
                              color: index % 2 === 0 ? "#ba68c8" : "#4dd0e1",
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <CustomTextField
                          fullWidth
                          label={`Amount (${displayTokenSymbol}) *`}
                          value={milestone.amount}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          type="number"
                          required
                          InputProps={{
                            startAdornment: (
                              <AttachMoneyIcon
                                color="primary"
                                sx={{ mr: 1, color: "#ba68c8" }}
                              />
                            ),
                            style: { color: "#ffffff" },
                          }}
                          InputLabelProps={{
                            style: { color: "#ba68c8" },
                          }}
                          helperText={`Amount in ${displayTokenSymbol}`}
                          error={amount > 1e12}
                        />
                        {amount > 1e12 && (
                          <Typography
                            variant="caption"
                            component="div"
                            color="#e57373"
                          >
                            Amount cannot exceed 1 trillion tokens
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Deadline (Optional)"
                            value={milestone.deadline}
                            onChange={(date) =>
                              handleMilestoneChange(index, "deadline", date)
                            }
                            minDate={dayjs()}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                helperText: "Leave empty for no deadline",
                                InputLabelProps: {
                                  style: { color: "#ba68c8" },
                                },
                                InputProps: {
                                  style: { color: "#ffffff" },
                                },
                                sx: {
                                  "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                      borderColor: "rgba(156, 39, 176, 0.4)",
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "rgba(156, 39, 176, 0.6)",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#9c27b0",
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12}>
                        <CustomTextField
                          fullWidth
                          label="Description *"
                          value={milestone.description}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          multiline
                          rows={2}
                          required
                          helperText="What needs to be completed for this milestone"
                          InputLabelProps={{
                            style: { color: "#ba68c8" },
                          }}
                          InputProps={{
                            style: { color: "#ffffff" },
                          }}
                        />
                      </Grid>
                    </Grid>

                    {amount > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <FeeBreakdown
                          amount={amount}
                          tokenSymbol={displayTokenSymbol}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {totalAmount > 0 && (
              <Paper
                sx={{
                  p: 3,
                  mt: 3,
                  bgcolor: "rgba(76, 175, 80, 0.15)",
                  border: "2px solid",
                  borderColor: "rgba(76, 175, 80, 0.4)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  gutterBottom
                  color="#81c784"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <PriceChangeIcon />
                  Total Contract Summary
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.3)",
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "rgba(76, 175, 80, 0.4)",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        component="div"
                        gutterBottom
                        color="#81c784"
                      >
                        Contract Totals
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="div"
                          color="#81c784"
                        >
                          Total Amount:
                        </Typography>
                        <Typography
                          variant="body1"
                          component="div"
                          fontWeight="bold"
                          color="#81c784"
                        >
                          {formatLargeNumber(totalAmount)} {displayTokenSymbol}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="div"
                          color="#81c784"
                        >
                          Platform Fees (1.5%):
                        </Typography>
                        <Typography
                          variant="body1"
                          component="div"
                          color="#ba68c8"
                        >
                          -{formatLargeNumber(calculateFee(totalAmount))}{" "}
                          {displayTokenSymbol}
                        </Typography>
                      </Box>
                      <Divider
                        sx={{ my: 1, bgcolor: "rgba(76, 175, 80, 0.2)" }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          component="div"
                          fontWeight="bold"
                          color="#81c784"
                        >
                          Net to Developer:
                        </Typography>
                        <Typography
                          variant="h6"
                          component="div"
                          fontWeight="bold"
                          color="#81c784"
                        >
                          {formatLargeNumber(calculateNetAmount(totalAmount))}{" "}
                          {displayTokenSymbol}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        bgcolor: "rgba(255, 152, 0, 0.15)",
                        p: 2,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: "rgba(255, 152, 0, 0.4)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        component="div"
                        gutterBottom
                        color="#ffb74d"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <GasMeterIcon fontSize="small" />
                        Gas Fee Estimate
                      </Typography>
                      <Typography
                        variant="body2"
                        component="div"
                        color="#ffb74d"
                        paragraph
                      >
                        Contract deployment requires significant gas fees
                        (typically 0.01-0.05 {networkInfo.nativeToken} on{" "}
                        {networkInfo.isTestnet ? "testnet" : "mainnet"}). This
                        includes:
                      </Typography>
                      <List dense>
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary="Smart Contract Deployment"
                            primaryTypographyProps={{
                              variant: "caption",
                              color: "#ffb74d",
                              component: "div",
                            }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary="Registry Registration"
                            primaryTypographyProps={{
                              variant: "caption",
                              color: "#ffb74d",
                              component: "div",
                            }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText
                            primary="Token Approval"
                            primaryTypographyProps={{
                              variant: "caption",
                              color: "#ffb74d",
                              component: "div",
                            }}
                          />
                        </ListItem>
                      </List>
                      <Typography
                        variant="caption"
                        component="div"
                        color="#ffb74d"
                      >
                        ⚠️ Contracts are PERMANENT and cannot be modified after
                        deployment
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 2:
        const totalAmountDisplay = milestones.reduce(
          (sum, m) => sum + (parseFloat(m.amount) || 0),
          0
        );
        const totalFeeDisplay = calculateFee(totalAmountDisplay);
        const totalNetDisplay = calculateNetAmount(totalAmountDisplay);

        return (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="h6"
              component="div"
              gutterBottom
              color="#ba68c8"
            >
              Review & Deploy
            </Typography>
            <Typography
              variant="body2"
              component="div"
              color="#ba68c8"
              gutterBottom
            >
              Please review all details carefully before deploying the contract.
            </Typography>

            <Alert
              severity="warning"
              sx={{
                mb: 3,
                bgcolor: "rgba(255, 152, 0, 0.15)",
                borderColor: "rgba(255, 152, 0, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="body2"
                component="div"
                fontWeight="bold"
                color="#ffb74d"
              >
                ⚠️ IMPORTANT: This contract will be PERMANENT on the blockchain.
                All details including amounts, addresses, and terms cannot be
                changed after deployment.
              </Typography>
            </Alert>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(156, 39, 176, 0.4)",
                    bgcolor: "rgba(156, 39, 176, 0.08)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      gutterBottom
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "#ba68c8",
                      }}
                    >
                      <PersonIcon sx={{ mr: 1 }} />
                      Contract Details
                    </Typography>
                    <Divider
                      sx={{ my: 1, bgcolor: "rgba(156, 39, 176, 0.2)" }}
                    />

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ mb: 1, fontWeight: 600, color: "#ba68c8" }}
                      >
                        Developer
                      </Typography>
                      <AddressWithProfile
                        address={developerAddress}
                        profile={profiles[developerAddress.toLowerCase()]}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ mb: 1, fontWeight: 600, color: "#ba68c8" }}
                      >
                        Payment Token
                      </Typography>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "rgba(0, 0, 0, 0.2)",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "rgba(156, 39, 176, 0.3)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <TokenIcon
                            fontSize="small"
                            sx={{
                              color:
                                paymentTokenSymbol === "CUSTOM"
                                  ? "#ffb74d"
                                  : "#4dd0e1",
                            }}
                          />
                          <Typography
                            variant="body2"
                            component="div"
                            sx={{
                              color:
                                paymentTokenSymbol === "CUSTOM"
                                  ? "#ffb74d"
                                  : "#4dd0e1",
                              fontWeight: 600,
                            }}
                          >
                            {paymentTokenSymbol || "No token selected"}
                          </Typography>
                          {paymentTokenSymbol &&
                            paymentTokenSymbol !== "CUSTOM" && (
                              <Chip
                                label={`${paymentTokenDecimals}d`}
                                size="small"
                                sx={{
                                  ml: 1,
                                  bgcolor: "rgba(156, 39, 176, 0.15)",
                                  color: "#ba68c8",
                                  border: `1px solid rgba(156, 39, 176, 0.4)`,
                                  fontSize: "0.6rem",
                                  height: 18,
                                }}
                              />
                            )}
                          {paymentTokenSymbol === "CUSTOM" && (
                            <Chip
                              label="Custom"
                              size="small"
                              sx={{
                                ml: 1,
                                bgcolor: "rgba(255, 152, 0, 0.15)",
                                color: "#ffb74d",
                                border: `1px solid rgba(255, 152, 0, 0.4)`,
                                fontSize: "0.6rem",
                              }}
                            />
                          )}
                        </Box>
                        {paymentTokenName && (
                          <Typography
                            variant="caption"
                            component="div"
                            color="#ba68c8"
                            sx={{ mb: 0.5 }}
                          >
                            {paymentTokenName}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          component="div"
                          sx={{
                            wordBreak: "break-all",
                            fontFamily: "monospace",
                            color: "#9e9e9e",
                            fontSize: "0.7rem",
                          }}
                        >
                          {paymentTokenAddress || "No address"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ mb: 1, fontWeight: 600, color: "#ba68c8" }}
                      >
                        Funder (You)
                      </Typography>
                      <AddressWithProfile
                        address={userAddress}
                        profile={profiles[userAddress.toLowerCase()]}
                        isCurrentUser={true}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(0, 188, 212, 0.4)",
                    bgcolor: "rgba(0, 188, 212, 0.08)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      component="div"
                      gutterBottom
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "#4dd0e1",
                      }}
                    >
                      <DescriptionIcon sx={{ mr: 1 }} />
                      Project Information
                    </Typography>
                    <Divider
                      sx={{ my: 1, bgcolor: "rgba(0, 188, 212, 0.2)" }}
                    />
                    <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                      <strong style={{ color: "#4dd0e1" }}>Title:</strong>{" "}
                      {projectTitle}
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                      <strong style={{ color: "#4dd0e1" }}>Description:</strong>
                      <br />
                      {projectDescription}
                    </Typography>
                    {projectTags.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ color: "#4dd0e1" }}
                        >
                          <strong>Tags:</strong>
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            mt: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {projectTags.map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              sx={{
                                bgcolor: "rgba(156, 39, 176, 0.15)",
                                color: "#ba68c8",
                                border: `1px solid rgba(156, 39, 176, 0.4)`,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(76, 175, 80, 0.4)",
                    bgcolor: "rgba(76, 175, 80, 0.08)",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 2 : 0,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        component="div"
                        sx={{ color: "#81c784" }}
                      >
                        Milestones Summary ({milestones.length})
                      </Typography>
                      <Chip
                        label="1.5% fee per milestone"
                        size="small"
                        sx={{
                          bgcolor: "rgba(76, 175, 80, 0.15)",
                          color: "#81c784",
                          border: `1px solid rgba(76, 175, 80, 0.4)`,
                        }}
                        icon={<CalculateIcon fontSize="small" />}
                      />
                    </Box>
                    <Divider
                      sx={{ my: 1, bgcolor: "rgba(76, 175, 80, 0.2)" }}
                    />

                    <TableContainer
                      sx={{ maxWidth: "100%", overflowX: "auto" }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "rgba(76, 175, 80, 0.15)" }}>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>#</strong>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>
                                Amount
                              </strong>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>
                                Fee (1.5%)
                              </strong>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>
                                Net to Dev
                              </strong>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>
                                Deadline
                              </strong>
                            </TableCell>
                            <TableCell>
                              <strong style={{ color: "#81c784" }}>
                                Description
                              </strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {milestones.map((milestone, index) => {
                            const amount = parseFloat(milestone.amount) || 0;
                            const fee = calculateFee(amount);
                            const net = calculateNetAmount(amount);

                            return (
                              <TableRow
                                key={index}
                                hover
                                sx={{
                                  "&:hover": {
                                    bgcolor: "rgba(156, 39, 176, 0.08)",
                                  },
                                }}
                              >
                                <TableCell>
                                  <Avatar
                                    sx={{
                                      bgcolor:
                                        index % 2 === 0 ? "#7b1fa2" : "#00838f",
                                      width: 24,
                                      height: 24,
                                      fontSize: "0.875rem",
                                      boxShadow: `0 0 8px ${
                                        index % 2 === 0
                                          ? "rgba(156, 39, 176, 0.3)"
                                          : "rgba(0, 188, 212, 0.3)"
                                      }`,
                                    }}
                                  >
                                    {index + 1}
                                  </Avatar>
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <AttachMoneyIcon
                                      fontSize="small"
                                      sx={{
                                        mr: 0.5,
                                        color:
                                          index % 2 === 0
                                            ? "#ba68c8"
                                            : "#4dd0e1",
                                      }}
                                    />
                                    {formatLargeNumber(amount)}{" "}
                                    {displayTokenSymbol}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    component="div"
                                    color="#ba68c8"
                                  >
                                    -{formatLargeNumber(fee)}{" "}
                                    {displayTokenSymbol}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    component="div"
                                    color="#81c784"
                                    fontWeight="medium"
                                  >
                                    {formatLargeNumber(net)}{" "}
                                    {displayTokenSymbol}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {milestone.deadline ? (
                                    milestone.deadline.format("MMM DD, YYYY")
                                  ) : (
                                    <Typography
                                      variant="caption"
                                      color="#ba68c8"
                                    >
                                      No deadline
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell style={{ color: "#ffffff" }}>
                                  {milestone.description}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box
                      sx={{
                        mt: 3,
                        p: 3,
                        bgcolor: "rgba(76, 175, 80, 0.15)",
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: "rgba(76, 175, 80, 0.4)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              component="div"
                              color="#ba68c8"
                              display="block"
                            >
                              Total Amount
                            </Typography>
                            <Typography
                              variant="h5"
                              component="div"
                              color="#ba68c8"
                              fontWeight="bold"
                            >
                              {formatLargeNumber(totalAmountDisplay)}{" "}
                              {displayTokenSymbol}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              component="div"
                              color="#ba68c8"
                              display="block"
                            >
                              Total Platform Fees
                            </Typography>
                            <Typography
                              variant="h6"
                              component="div"
                              color="#ba68c8"
                            >
                              -{formatLargeNumber(totalFeeDisplay)}{" "}
                              {displayTokenSymbol}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              component="div"
                              color="#81c784"
                              display="block"
                              fontWeight="medium"
                            >
                              Net to Developer
                            </Typography>
                            <Typography
                              variant="h4"
                              component="div"
                              color="#81c784"
                              fontWeight="bold"
                            >
                              {formatLargeNumber(totalNetDisplay)}{" "}
                              {displayTokenSymbol}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert
              severity="error"
              sx={{
                mt: 3,
                bgcolor: "rgba(244, 67, 54, 0.15)",
                borderColor: "rgba(244, 67, 54, 0.4)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="body2"
                component="div"
                fontWeight="bold"
                gutterBottom
                color="#e57373"
              >
                ⚠️ FINAL WARNING: GAS FEES & CONTRACT PERMANENCE
              </Typography>
              <Typography
                variant="body2"
                component="div"
                color="#e57373"
                paragraph
              >
                This deployment will require significant gas fees (multiple
                transactions) and the contract will be PERMANENTLY deployed on
                the blockchain.
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                <li>
                  <Typography variant="body2" component="div" color="#e57373">
                    <strong>Gas Fees:</strong> You will pay{" "}
                    {networkInfo.nativeToken} for 4 transactions: contract
                    deployment, registry registration, token approval, and
                    funding
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="div" color="#e57373">
                    <strong>Permanence:</strong> Once deployed, this contract
                    cannot be modified, updated, or deleted
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="div" color="#e57373">
                    <strong>Irreversible:</strong> All actions are final and
                    cannot be undone
                  </Typography>
                </li>
              </Box>
              <Typography
                variant="body2"
                component="div"
                color="#e57373"
                fontWeight="bold"
              >
                Please verify ALL details carefully before proceeding.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!projectTitle.trim()) {
        showSnackbar("Please enter a project title", "error");
        return;
      }
      if (!projectDescription.trim()) {
        showSnackbar("Please enter a project description", "error");
        return;
      }
    }

    if (activeStep === 1) {
      if (!developerAddress || !ethers.isAddress(developerAddress)) {
        showSnackbar("Please provide a valid developer address", "error");
        return;
      }

      if (!paymentTokenAddress || !ethers.isAddress(paymentTokenAddress)) {
        showSnackbar("Please provide a valid payment token address", "error");
        return;
      }

      const validation = validateMilestoneAmounts();
      if (!validation.valid) {
        showSnackbar(validation.error!, "error");
        return;
      }
    }

    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStatusIcon = (status: string) => {
    switch (true) {
      case status.includes("Completed"):
        return <CheckCircleIcon color="success" />;
      case status.includes("Cancelled"):
        return <CancelIcon color="error" />;
      case status.includes("Disputed"):
        return <GavelIcon color="warning" />;
      default:
        return <HourglassEmptyIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (true) {
      case status.includes("Completed"):
        return "success";
      case status.includes("Cancelled"):
        return "error";
      case status.includes("Disputed"):
        return "warning";
      default:
        return "info";
    }
  };

  const filteredContracts = deployedContracts.filter((contract) => {
    if (viewFilter === "all") return true;
    if (viewFilter === "funder") return contract.userRole === "funder";
    if (viewFilter === "developer") return contract.userRole === "developer";
    return true;
  });

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!deploymentData) return null;

    const {
      projectTitle,
      developerAddress,
      developerProfile,
      paymentTokenSymbol,
      totalAmount,
      totalFee,
      totalNet,
      milestoneDetails,
      milestonesCount,
      userAddress: dataUserAddress,
    } = deploymentData;

    return (
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "rgba(156, 39, 176, 0.15)",
            color: "#ba68c8",
            borderBottom: `1px solid rgba(156, 39, 176, 0.4)`,
            display: "flex",
            alignItems: "center",
            gap: 2,
            backdropFilter: "blur(10px)",
          }}
        >
          <LocalAtmIcon />
          <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              Confirm Contract Deployment
            </Typography>
            <Typography variant="caption" component="div" color="#ba68c8">
              {projectTitle}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              bgcolor: "rgba(255, 152, 0, 0.15)",
              borderColor: "rgba(255, 152, 0, 0.4)",
            }}
          >
            <Typography
              variant="body2"
              component="div"
              fontWeight="bold"
              color="#ffb74d"
            >
              ⚠️ This contract will be PERMANENT on the blockchain
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{ borderColor: "rgba(156, 39, 176, 0.4)", mb: 2 }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    component="div"
                    gutterBottom
                    color="#ba68c8"
                  >
                    Contract Summary
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Total Amount:
                    </Typography>
                    <Typography
                      variant="body1"
                      component="div"
                      fontWeight="bold"
                      color="#ba68c8"
                    >
                      {formatLargeNumber(totalAmount)} {paymentTokenSymbol}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Platform Fees (1.5%):
                    </Typography>
                    <Typography variant="body1" component="div" color="#ba68c8">
                      -{formatLargeNumber(totalFee)} {paymentTokenSymbol}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1, bgcolor: "rgba(156, 39, 176, 0.2)" }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      variant="body2"
                      component="div"
                      fontWeight="bold"
                      color="#ba68c8"
                    >
                      Net to Developer:
                    </Typography>
                    <Typography
                      variant="h6"
                      component="div"
                      fontWeight="bold"
                      color="#81c784"
                    >
                      {formatLargeNumber(totalNet)} {paymentTokenSymbol}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card
                variant="outlined"
                sx={{ borderColor: "rgba(0, 188, 212, 0.4)" }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    component="div"
                    gutterBottom
                    color="#4dd0e1"
                  >
                    Parties Involved
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      component="div"
                      color="#ba68c8"
                    >
                      Funder (You)
                    </Typography>
                    <AddressWithProfile
                      address={dataUserAddress}
                      profile={profiles[dataUserAddress.toLowerCase()]}
                      isCurrentUser={true}
                      showYou={false}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      component="div"
                      color="#ba68c8"
                    >
                      Developer
                    </Typography>
                    <AddressWithProfile
                      address={developerAddress}
                      profile={developerProfile}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{ borderColor: "rgba(76, 175, 80, 0.4)" }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    component="div"
                    gutterBottom
                    color="#81c784"
                  >
                    Milestones ({milestonesCount})
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                    {milestoneDetails.map((milestone: any, index: number) => (
                      <ListItem
                        key={index}
                        divider={index < milestoneDetails.length - 1}
                      >
                        <ListItemText
                          primary={`Milestone ${
                            milestone.number
                          }: ${formatLargeNumber(
                            milestone.net
                          )} ${paymentTokenSymbol}`}
                          secondary={
                            <>
                              <Typography
                                variant="caption"
                                component="div"
                                color="#81c784"
                              >
                                Total: {formatLargeNumber(milestone.amount)}{" "}
                                {paymentTokenSymbol}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="#ba68c8"
                                component="div"
                              >
                                Fee: {formatLargeNumber(milestone.fee)}{" "}
                                {paymentTokenSymbol}
                              </Typography>
                            </>
                          }
                          primaryTypographyProps={{
                            component: "div",
                            color: "#81c784",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(244, 67, 54, 0.15)",
                  borderColor: "rgba(244, 67, 54, 0.4)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  fontWeight="bold"
                  color="#e57373"
                >
                  ⚠️ Gas Fee Warning
                </Typography>
                <Typography variant="body2" component="div" color="#e57373">
                  This deployment requires multiple transactions with
                  significant gas fees (estimated 0.01-0.05{" "}
                  {networkInfo.nativeToken}).
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: `1px solid rgba(156, 39, 176, 0.2)`,
          }}
        >
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            sx={{ borderColor: "rgba(255, 255, 255, 0.3)", color: "#ba68c8" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmDialogOpen(false);
              setShowGasWarning(true);
            }}
            sx={{
              background: "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
              },
            }}
          >
            Proceed to Gas Warning
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            backgroundColor: "#000000",
            color: "#ffffff",
          }}
        >
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showCreateButton={true}
          />

          {/* Mobile sidebar drawer */}
          <Drawer
            anchor="left"
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            sx={{
              "& .MuiDrawer-paper": {
                width: 280,
                backgroundColor: "#000000",
                borderRight: `1px solid rgba(156, 39, 176, 0.2)`,
              },
            }}
          >
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
              showCreateButton={true}
              isMobile={true}
            />
          </Drawer>

          {/* Main content with proper spacing from sidebar */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: isMobile ? 2 : 3,
              width: { md: `calc(100% - 280px)` },
              ml: { md: "280px" },
              maxWidth: "100%",
              overflowX: "hidden",
              minHeight: "100vh",
              backgroundColor: "#000000",
            }}
          >
            <Container
              maxWidth="xl"
              sx={{
                py: isMobile ? 2 : 4,
                pl: { md: 2 },
                pr: { md: 2 },
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 2 : 0,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {isMobile && (
                      <IconButton
                        onClick={() => setSidebarOpen(true)}
                        sx={{
                          color: "#ba68c8",
                          bgcolor: "rgba(156, 39, 176, 0.15)",
                          "&:hover": {
                            bgcolor: "rgba(156, 39, 176, 0.25)",
                          },
                        }}
                      >
                        <MenuIcon />
                      </IconButton>
                    )}
                    <Typography variant="h4" component="div">
                      <TrophyIcon
                        sx={{
                          verticalAlign: "middle",
                          mr: 2,
                          fontSize: isMobile ? 32 : 40,
                          background:
                            "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      />
                      OpenForge Escrow
                    </Typography>
                  </Box>

                  {userAddress && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexDirection: isMobile ? "column" : "row",
                      }}
                    >
                      <AddressWithProfile
                        address={userAddress}
                        profile={profiles[userAddress.toLowerCase()]}
                        isCurrentUser={true}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Chip
                          label={networkInfo.name}
                          sx={{
                            bgcolor: networkInfo.isTestnet
                              ? "rgba(255, 152, 0, 0.15)"
                              : "rgba(0, 188, 212, 0.15)",
                            color: networkInfo.isTestnet
                              ? "#ffb74d"
                              : "#4dd0e1",
                            border: `1px solid ${
                              networkInfo.isTestnet
                                ? "rgba(255, 152, 0, 0.4)"
                                : "rgba(0, 188, 212, 0.4)"
                            }`,
                          }}
                          icon={
                            <TrendingUpIcon
                              sx={{
                                color: networkInfo.isTestnet
                                  ? "#ffb74d"
                                  : "#4dd0e1",
                              }}
                            />
                          }
                        />
                        <Typography
                          variant="caption"
                          color="#ba68c8"
                          sx={{ textAlign: "center" }}
                        >
                          Gas: {networkInfo.nativeToken}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Typography
                  variant="body1"
                  component="div"
                  color="#ba68c8"
                  gutterBottom
                >
                  Secure milestone-based escrow contracts with verified profiles
                  on {networkInfo.name} network
                </Typography>

                {userAddress && (
                  <Box
                    sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}
                  >
                    <Chip
                      label={`${deployedContracts.length} contract(s)`}
                      sx={{
                        bgcolor: "rgba(156, 39, 176, 0.15)",
                        color: "#ba68c8",
                        border: `1px solid rgba(156, 39, 176, 0.4)`,
                      }}
                      icon={<DescriptionIcon sx={{ color: "#ba68c8" }} />}
                    />
                    <Chip
                      label="1.5% platform fee"
                      sx={{
                        bgcolor: "rgba(76, 175, 80, 0.15)",
                        color: "#81c784",
                        border: `1px solid rgba(76, 175, 80, 0.4)`,
                      }}
                      icon={<CalculateIcon sx={{ color: "#81c784" }} />}
                    />
                    <Chip
                      label={`${filteredContracts.length} filtered`}
                      variant="outlined"
                      sx={{
                        borderColor: "rgba(156, 39, 176, 0.4)",
                        color: "#ba68c8",
                      }}
                    />
                    <Chip
                      label={`Gas: ${networkInfo.nativeToken}`}
                      sx={{
                        bgcolor: networkInfo.isTestnet
                          ? "rgba(255, 152, 0, 0.15)"
                          : "rgba(33, 150, 243, 0.15)",
                        color: networkInfo.isTestnet ? "#ffb74d" : "#64b5f6",
                        border: `1px solid ${
                          networkInfo.isTestnet
                            ? "rgba(255, 152, 0, 0.4)"
                            : "rgba(33, 150, 243, 0.4)"
                        }`,
                      }}
                      icon={<GasMeterIcon fontSize="small" />}
                    />
                  </Box>
                )}
              </Box>

              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
              >
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant={isMobile ? "scrollable" : "fullWidth"}
                  scrollButtons={isMobile ? "auto" : false}
                  sx={{
                    mb: 3,
                    "& .MuiTab-root": {
                      fontSize: isMobile ? "0.9rem" : "1rem",
                      fontWeight: 600,
                      minWidth: isMobile ? "auto" : undefined,
                      px: isMobile ? 1 : 2,
                    },
                    "& .Mui-selected": {
                      color: "#ffffff !important",
                    },
                  }}
                >
                  <Tab
                    label={isMobile ? "Deploy" : "Deploy New Contract"}
                    icon={<AddIcon />}
                    iconPosition="start"
                    sx={{ py: 2, color: "#ba68c8" }}
                  />
                  <Tab
                    label={isMobile ? "Contracts" : "My Contracts"}
                    icon={<DescriptionIcon />}
                    iconPosition="start"
                    sx={{ py: 2, color: "#ba68c8" }}
                  />
                </Tabs>

                <Paper
                  sx={{
                    p: isMobile ? 2 : { xs: 2, sm: 3, md: 4 },
                    backgroundColor: "#0a0a0a",
                    overflow: "hidden",
                    border: `1px solid rgba(156, 39, 176, 0.2)`,
                  }}
                >
                  {activeTab === 0 ? (
                    <>
                      <Stepper
                        activeStep={activeStep}
                        sx={{
                          mb: 4,
                          overflowX: "auto",
                          py: 2,
                          "& .MuiStepLabel-label": {
                            fontSize: isMobile ? "0.8rem" : "0.875rem",
                          },
                        }}
                      >
                        {steps.map((label, index) => (
                          <Step key={label}>
                            <StepLabel
                              sx={{
                                "& .MuiStepLabel-label": {
                                  color: "#ba68c8",
                                  "&.Mui-active": {
                                    color: "#ffffff",
                                  },
                                  "&.Mui-completed": {
                                    color: "#4caf50",
                                  },
                                },
                              }}
                            >
                              {isMobile ? label.split(" ").pop() : label}
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>

                      {getStepContent(activeStep)}

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 4,
                          pt: 2,
                          borderTop: 1,
                          borderColor: "divider",
                          flexDirection: isMobile ? "column" : "row",
                          gap: isMobile ? 2 : 0,
                        }}
                      >
                        <Button
                          disabled={activeStep === 0}
                          onClick={handleBack}
                          variant="outlined"
                          sx={{
                            borderColor: "rgba(156, 39, 176, 0.4)",
                            color: "#ba68c8",
                            width: isMobile ? "100%" : "auto",
                            "&:hover": {
                              borderColor: "#9c27b0",
                            },
                          }}
                        >
                          Back
                        </Button>

                        {activeStep === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={showDeploymentConfirmation}
                            disabled={loading || !signer}
                            startIcon={
                              loading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <AddIcon />
                              )
                            }
                            size="large"
                            sx={{
                              minWidth: isMobile ? "100%" : 200,
                              background:
                                "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
                              },
                            }}
                          >
                            {loading ? "Deploying..." : "Review & Deploy"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{
                              background:
                                "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
                              },
                              width: isMobile ? "100%" : "auto",
                            }}
                          >
                            Next
                          </Button>
                        )}
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 3,
                          flexWrap: "wrap",
                          gap: 2,
                          flexDirection: isMobile ? "column" : "row",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="div"
                            fontWeight="medium"
                            color="#ba68c8"
                          >
                            My Contracts
                          </Typography>
                          <Badge
                            badgeContent={filteredContracts.length}
                            color="primary"
                            showZero
                          >
                            <DescriptionIcon color="action" />
                          </Badge>
                          <FormControl
                            size="small"
                            sx={{ minWidth: isMobile ? "100%" : 150 }}
                          >
                            <InputLabel sx={{ color: "#ba68c8" }}>
                              Filter by Role
                            </InputLabel>
                            <Select
                              value={viewFilter}
                              label="Filter by Role"
                              onChange={(e) =>
                                setViewFilter(e.target.value as any)
                              }
                              sx={{
                                "& .MuiSelect-select": {
                                  color: "#ba68c8",
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(156, 39, 176, 0.4)",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "rgba(156, 39, 176, 0.6)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "#9c27b0",
                                  },
                              }}
                            >
                              <MenuItem value="all" sx={{ color: "#ba68c8" }}>
                                All Roles
                              </MenuItem>
                              <MenuItem
                                value="funder"
                                sx={{ color: "#ba68c8" }}
                              >
                                As Funder
                              </MenuItem>
                              <MenuItem
                                value="developer"
                                sx={{ color: "#ba68c8" }}
                              >
                                As Developer
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => fetchUserContracts(userAddress)}
                            disabled={loadingContracts || !signer}
                            startIcon={
                              loadingContracts ? (
                                <CircularProgress size={20} />
                              ) : (
                                <RefreshIcon />
                              )
                            }
                            sx={{
                              borderColor: "rgba(156, 39, 176, 0.4)",
                              color: "#ba68c8",
                              flex: isMobile ? 1 : "auto",
                              "&:hover": {
                                borderColor: "#9c27b0",
                              },
                            }}
                          >
                            {loadingContracts ? "Refreshing..." : "Refresh"}
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => setActiveTab(0)}
                            startIcon={<AddIcon />}
                            sx={{
                              background:
                                "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
                              },
                              flex: isMobile ? 1 : "auto",
                            }}
                          >
                            {isMobile ? "New" : "New Contract"}
                          </Button>
                        </Box>
                      </Box>

                      {!signer ? (
                        <Alert
                          severity="info"
                          sx={{
                            mb: 2,
                            bgcolor: "rgba(156, 39, 176, 0.15)",
                            borderColor: "rgba(156, 39, 176, 0.4)",
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <Typography
                            variant="body2"
                            component="div"
                            color="#ba68c8"
                          >
                            Please connect your wallet to view your contracts.
                          </Typography>
                        </Alert>
                      ) : loadingContracts ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            py: 8,
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <CircularProgress
                            size={60}
                            sx={{ color: "#9c27b0" }}
                          />
                          <Typography
                            variant="body1"
                            component="div"
                            color="#ba68c8"
                          >
                            Loading contracts...
                          </Typography>
                        </Box>
                      ) : filteredContracts.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                          <DescriptionIcon
                            sx={{
                              fontSize: 80,
                              color: "rgba(156, 39, 176, 0.2)",
                              mb: 2,
                              filter:
                                "drop-shadow(0 0 10px rgba(156, 39, 176, 0.3))",
                            }}
                          />
                          <Typography
                            variant="h6"
                            component="div"
                            color="#ba68c8"
                            gutterBottom
                          >
                            No contracts found
                          </Typography>
                          <Typography
                            variant="body2"
                            component="div"
                            color="#ba68c8"
                            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
                          >
                            {viewFilter === "all"
                              ? "You don't have any milestone contracts yet. Deploy your first contract to get started!"
                              : `No contracts found where you are the ${viewFilter}. Try changing the filter to "All Roles".`}
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => setActiveTab(0)}
                            startIcon={<AddIcon />}
                            size="large"
                            sx={{
                              background:
                                "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
                              },
                            }}
                          >
                            Deploy New Contract
                          </Button>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          {filteredContracts.map((contract) => {
                            const funderProfile =
                              profiles[contract.funder.toLowerCase()];
                            const developerProfile =
                              profiles[contract.developer.toLowerCase()];
                            const isExpanded =
                              expandedContract === contract.escrowAddress;
                            const progressPercentage =
                              (parseFloat(contract.releasedAmount) /
                                parseFloat(contract.totalAmount)) *
                              100;

                            return (
                              <Card
                                key={`${contract.projectId}-${contract.escrowAddress}`}
                                elevation={isExpanded ? 4 : 1}
                              >
                                <CardContent>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 2,
                                      flexDirection: isMobile
                                        ? "column"
                                        : "row",
                                      gap: isMobile ? 2 : 0,
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 2,
                                          mb: 1,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <Typography
                                          variant="h6"
                                          component="div"
                                          sx={{ color: "#ba68c8" }}
                                        >
                                          {contract.title}
                                        </Typography>
                                        <Chip
                                          label={`ID: ${contract.projectId}`}
                                          size="small"
                                          sx={{
                                            bgcolor: "rgba(0, 188, 212, 0.15)",
                                            color: "#4dd0e1",
                                            border: `1px solid rgba(0, 188, 212, 0.4)`,
                                          }}
                                        />
                                        <Chip
                                          label="1.5% fee"
                                          size="small"
                                          sx={{
                                            bgcolor: "rgba(76, 175, 80, 0.15)",
                                            color: "#81c784",
                                            fontSize: "0.7rem",
                                            border: `1px solid rgba(76, 175, 80, 0.4)`,
                                          }}
                                        />
                                      </Box>
                                      <Typography
                                        variant="body2"
                                        component="div"
                                        color="#ba68c8"
                                        paragraph
                                      >
                                        {contract.description}
                                      </Typography>

                                      <Box
                                        sx={{
                                          display: "flex",
                                          gap: 1,
                                          mt: 1,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <Chip
                                          label={
                                            contract.userRole === "funder"
                                              ? "Funder"
                                              : "Developer"
                                          }
                                          color={
                                            contract.userRole === "funder"
                                              ? "primary"
                                              : "secondary"
                                          }
                                          size="small"
                                          icon={<PersonIcon />}
                                          sx={{
                                            border: `1px solid ${
                                              contract.userRole === "funder"
                                                ? "rgba(156, 39, 176, 0.4)"
                                                : "rgba(0, 188, 212, 0.4)"
                                            }`,
                                          }}
                                        />
                                        <Chip
                                          label={contract.status}
                                          color={
                                            getStatusColor(
                                              contract.status
                                            ) as any
                                          }
                                          icon={getStatusIcon(contract.status)}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderColor:
                                              getStatusColor(
                                                contract.status
                                              ) === "success"
                                                ? "rgba(76, 175, 80, 0.4)"
                                                : getStatusColor(
                                                    contract.status
                                                  ) === "error"
                                                ? "rgba(244, 67, 54, 0.4)"
                                                : getStatusColor(
                                                    contract.status
                                                  ) === "warning"
                                                ? "rgba(255, 152, 0, 0.4)"
                                                : "rgba(33, 150, 243, 0.4)",
                                          }}
                                        />
                                        <Chip
                                          label={`${contract.paymentTokenSymbol}`}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            borderColor:
                                              contract.paymentTokenSymbol ===
                                              "CUSTOM"
                                                ? "rgba(255, 152, 0, 0.4)"
                                                : "rgba(156, 39, 176, 0.4)",
                                            color:
                                              contract.paymentTokenSymbol ===
                                              "CUSTOM"
                                                ? "#ffb74d"
                                                : "#ba68c8",
                                            bgcolor:
                                              contract.paymentTokenSymbol ===
                                              "CUSTOM"
                                                ? "rgba(255, 152, 0, 0.15)"
                                                : "transparent",
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        toggleExpandContract(
                                          contract.escrowAddress
                                        )
                                      }
                                      sx={{
                                        color: "#ba68c8",
                                        bgcolor: "rgba(156, 39, 176, 0.15)",
                                        "&:hover": {
                                          bgcolor: "rgba(156, 39, 176, 0.25)",
                                        },
                                      }}
                                    >
                                      {isExpanded ? (
                                        <ExpandLessIcon />
                                      ) : (
                                        <ExpandMoreIcon />
                                      )}
                                    </IconButton>
                                  </Box>

                                  <Box sx={{ mb: 2 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        component="div"
                                        color="#ba68c8"
                                      >
                                        Progress:{" "}
                                        {progressPercentage.toFixed(1)}%
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        component="div"
                                        color="#ba68c8"
                                      >
                                        {formatLargeNumber(
                                          parseFloat(contract.releasedAmount)
                                        )}{" "}
                                        /{" "}
                                        {formatLargeNumber(
                                          parseFloat(contract.totalAmount)
                                        )}{" "}
                                        {contract.paymentTokenSymbol}
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={progressPercentage}
                                      sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: "rgba(156, 39, 176, 0.15)",
                                        "& .MuiLinearProgress-bar": {
                                          bgcolor:
                                            progressPercentage === 100
                                              ? "#4caf50"
                                              : "#9c27b0",
                                          borderRadius: 4,
                                        },
                                      }}
                                    />
                                  </Box>

                                  <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} md={6}>
                                      <Box
                                        sx={{
                                          p: 2,
                                          border: "1px solid",
                                          borderColor:
                                            "rgba(156, 39, 176, 0.2)",
                                          bgcolor: "rgba(156, 39, 176, 0.08)",
                                          borderRadius: 2,
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          component="div"
                                          color="#ba68c8"
                                          gutterBottom
                                        >
                                          Funder
                                        </Typography>
                                        <AddressWithProfile
                                          address={contract.funder}
                                          profile={funderProfile}
                                          isCurrentUser={
                                            contract.funder === userAddress
                                          }
                                        />
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box
                                        sx={{
                                          p: 2,
                                          border: "1px solid",
                                          borderColor: "rgba(0, 188, 212, 0.2)",
                                          bgcolor: "rgba(0, 188, 212, 0.08)",
                                          borderRadius: 2,
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          component="div"
                                          color="#ba68c8"
                                          gutterBottom
                                        >
                                          Developer
                                        </Typography>
                                        <AddressWithProfile
                                          address={contract.developer}
                                          profile={developerProfile}
                                          isCurrentUser={
                                            contract.developer === userAddress
                                          }
                                        />
                                      </Box>
                                    </Grid>
                                  </Grid>

                                  <Collapse in={isExpanded}>
                                    <Box sx={{ mt: 3 }}>
                                      <Divider
                                        sx={{
                                          my: 2,
                                          bgcolor: "rgba(156, 39, 176, 0.15)",
                                        }}
                                      />

                                      <Typography
                                        variant="subtitle2"
                                        component="div"
                                        gutterBottom
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          color: "#ba68c8",
                                        }}
                                      >
                                        <TimelineIcon
                                          sx={{
                                            mr: 1,
                                            fontSize: "1rem",
                                            color: "#ba68c8",
                                          }}
                                        />
                                        Milestones ({contract.milestones.length}
                                        )
                                      </Typography>

                                      <Box sx={{ overflowX: "auto" }}>
                                        <TableContainer
                                          component={Box}
                                          sx={{
                                            mb: 2,
                                            border: "1px solid",
                                            borderColor:
                                              "rgba(156, 39, 176, 0.2)",
                                            borderRadius: 2,
                                            backgroundColor:
                                              "rgba(0, 0, 0, 0.3)",
                                          }}
                                        >
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow
                                                sx={{
                                                  bgcolor:
                                                    "rgba(156, 39, 176, 0.15)",
                                                }}
                                              >
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    #
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Amount
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Fee (1.5%)
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Net to Dev
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Status
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Deadline
                                                  </strong>
                                                </TableCell>
                                                <TableCell>
                                                  <strong
                                                    style={{ color: "#ba68c8" }}
                                                  >
                                                    Description
                                                  </strong>
                                                </TableCell>
                                                {contract.userRole ===
                                                  "funder" &&
                                                  contract.status ===
                                                    "Funded (Active)" && (
                                                    <TableCell>
                                                      <strong
                                                        style={{
                                                          color: "#ba68c8",
                                                        }}
                                                      >
                                                        Actions
                                                      </strong>
                                                    </TableCell>
                                                  )}
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {contract.milestones.map(
                                                (milestone, index) => {
                                                  const amount = parseFloat(
                                                    ethers.formatUnits(
                                                      milestone.amount,
                                                      contract.paymentTokenDecimals
                                                    )
                                                  );
                                                  const fee =
                                                    calculateFee(amount);
                                                  const net =
                                                    calculateNetAmount(amount);

                                                  return (
                                                    <TableRow
                                                      key={index}
                                                      hover
                                                      sx={{
                                                        "&:hover": {
                                                          bgcolor:
                                                            "rgba(156, 39, 176, 0.08)",
                                                        },
                                                      }}
                                                    >
                                                      <TableCell>
                                                        <Avatar
                                                          sx={{
                                                            bgcolor:
                                                              index % 2 === 0
                                                                ? "#7b1fa2"
                                                                : "#00838f",
                                                            width: 24,
                                                            height: 24,
                                                            fontSize:
                                                              "0.875rem",
                                                            boxShadow: `0 0 8px ${
                                                              index % 2 === 0
                                                                ? "rgba(156, 39, 176, 0.3)"
                                                                : "rgba(0, 188, 212, 0.3)"
                                                            }`,
                                                          }}
                                                        >
                                                          {index + 1}
                                                        </Avatar>
                                                      </TableCell>
                                                      <TableCell>
                                                        <Box
                                                          sx={{
                                                            display: "flex",
                                                            alignItems:
                                                              "center",
                                                          }}
                                                        >
                                                          <AttachMoneyIcon
                                                            fontSize="small"
                                                            sx={{
                                                              mr: 0.5,
                                                              color:
                                                                index % 2 === 0
                                                                  ? "#ba68c8"
                                                                  : "#4dd0e1",
                                                            }}
                                                          />
                                                          {formatLargeNumber(
                                                            amount
                                                          )}{" "}
                                                          {
                                                            contract.paymentTokenSymbol
                                                          }
                                                        </Box>
                                                      </TableCell>
                                                      <TableCell>
                                                        <Typography
                                                          variant="body2"
                                                          component="div"
                                                          color="#ba68c8"
                                                        >
                                                          -
                                                          {formatLargeNumber(
                                                            fee
                                                          )}{" "}
                                                          {
                                                            contract.paymentTokenSymbol
                                                          }
                                                        </Typography>
                                                      </TableCell>
                                                      <TableCell>
                                                        <Typography
                                                          variant="body2"
                                                          component="div"
                                                          color="#81c784"
                                                          fontWeight="medium"
                                                        >
                                                          {formatLargeNumber(
                                                            net
                                                          )}{" "}
                                                          {
                                                            contract.paymentTokenSymbol
                                                          }
                                                        </Typography>
                                                      </TableCell>
                                                      <TableCell>
                                                        {milestone.released ? (
                                                          <Chip
                                                            label="Released"
                                                            size="small"
                                                            color="success"
                                                            icon={
                                                              <CheckCircleIcon />
                                                            }
                                                            sx={{
                                                              border: `1px solid rgba(76, 175, 80, 0.4)`,
                                                            }}
                                                          />
                                                        ) : milestone.cancelled ? (
                                                          <Chip
                                                            label="Cancelled"
                                                            size="small"
                                                            color="error"
                                                            icon={
                                                              <CancelIcon />
                                                            }
                                                            sx={{
                                                              border: `1px solid rgba(244, 67, 54, 0.4)`,
                                                            }}
                                                          />
                                                        ) : (
                                                          <Chip
                                                            label="Pending"
                                                            size="small"
                                                            sx={{
                                                              bgcolor:
                                                                "rgba(156, 39, 176, 0.15)",
                                                              color: "#ba68c8",
                                                              border: `1px solid rgba(156, 39, 176, 0.4)`,
                                                            }}
                                                            icon={
                                                              <PendingIcon />
                                                            }
                                                          />
                                                        )}
                                                      </TableCell>
                                                      <TableCell>
                                                        <Typography
                                                          variant="body2"
                                                          component="div"
                                                          color="#ffffff"
                                                        >
                                                          {milestone.deadline !==
                                                          "0"
                                                            ? new Date(
                                                                Number(
                                                                  milestone.deadline
                                                                ) * 1000
                                                              ).toLocaleDateString()
                                                            : "No deadline"}
                                                          {milestone.isOverdue && (
                                                            <Chip
                                                              label="Overdue"
                                                              size="small"
                                                              color="error"
                                                              sx={{
                                                                ml: 1,
                                                                border: `1px solid rgba(244, 67, 54, 0.4)`,
                                                              }}
                                                            />
                                                          )}
                                                        </Typography>
                                                      </TableCell>
                                                      <TableCell
                                                        style={{
                                                          color: "#ffffff",
                                                        }}
                                                      >
                                                        {milestone.description}
                                                      </TableCell>
                                                      <TableCell
                                                        style={{
                                                          color: "#ffffff",
                                                        }}
                                                      >
                                                        {milestone.description}
                                                      </TableCell>
                                                      {contract.userRole ===
                                                        "funder" &&
                                                        contract.status ===
                                                          "Funded (Active)" && (
                                                          <TableCell>
                                                            <Box
                                                              sx={{
                                                                display: "flex",
                                                                gap: 0.5,
                                                                flexDirection:
                                                                  isMobile
                                                                    ? "column"
                                                                    : "row",
                                                              }}
                                                            >
                                                              {milestone.canRelease && (
                                                                <Tooltip title="Release this milestone (1.5% fee will be deducted)">
                                                                  <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    sx={{
                                                                      background:
                                                                        "linear-gradient(45deg, #009688 30%, #26a69a 90%)",
                                                                      "&:hover":
                                                                        {
                                                                          background:
                                                                            "linear-gradient(45deg, #00897b 30%, #00838f 90%)",
                                                                        },
                                                                    }}
                                                                    onClick={() =>
                                                                      handleReleaseMilestone(
                                                                        contract.escrowAddress,
                                                                        index
                                                                      )
                                                                    }
                                                                  >
                                                                    Release
                                                                  </Button>
                                                                </Tooltip>
                                                              )}
                                                              {milestone.canCancel && (
                                                                <Tooltip title="Cancel overdue milestone">
                                                                  <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                      borderColor:
                                                                        "rgba(156, 39, 176, 0.4)",
                                                                      color:
                                                                        "#ba68c8",
                                                                      "&:hover":
                                                                        {
                                                                          borderColor:
                                                                            "#9c27b0",
                                                                        },
                                                                    }}
                                                                    onClick={() =>
                                                                      handleCancelMilestone(
                                                                        contract.escrowAddress,
                                                                        index
                                                                      )
                                                                    }
                                                                  >
                                                                    Cancel
                                                                  </Button>
                                                                </Tooltip>
                                                              )}
                                                            </Box>
                                                          </TableCell>
                                                        )}
                                                    </TableRow>
                                                  );
                                                }
                                              )}
                                            </TableBody>
                                          </Table>
                                        </TableContainer>
                                      </Box>

                                      {contract.disputeReason && (
                                        <Alert
                                          severity="warning"
                                          sx={{
                                            mb: 2,
                                            bgcolor: "rgba(255, 152, 0, 0.15)",
                                            borderColor:
                                              "rgba(255, 152, 0, 0.4)",
                                            backdropFilter: "blur(10px)",
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle2"
                                            component="div"
                                            gutterBottom
                                            color="#ffb74d"
                                          >
                                            Dispute Raised
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            component="div"
                                            color="#ffb74d"
                                          >
                                            <strong>Reason:</strong>{" "}
                                            {contract.disputeReason}
                                          </Typography>
                                        </Alert>
                                      )}

                                      <CardActions
                                        sx={{
                                          justifyContent: "flex-end",
                                          gap: 1,
                                          flexWrap: "wrap",
                                          flexDirection: isMobile
                                            ? "column"
                                            : "row",
                                        }}
                                      >
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<LaunchIcon />}
                                          href={`${networkInfo.explorer}/address/${contract.escrowAddress}`}
                                          target="_blank"
                                          sx={{
                                            borderColor:
                                              "rgba(156, 39, 176, 0.4)",
                                            color: "#ba68c8",
                                            "&:hover": {
                                              borderColor: "#9c27b0",
                                            },
                                          }}
                                        >
                                          View on{" "}
                                          {networkInfo.name === "Ethereum"
                                            ? "Etherscan"
                                            : "Explorer"}
                                        </Button>

                                        {contract.userRole === "funder" &&
                                          contract.status ===
                                            "Funded (Active)" && (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                borderColor:
                                                  "rgba(156, 39, 176, 0.4)",
                                                color: "#ba68c8",
                                                "&:hover": {
                                                  borderColor: "#9c27b0",
                                                },
                                              }}
                                              onClick={() =>
                                                handleCancelProject(
                                                  contract.escrowAddress
                                                )
                                              }
                                            >
                                              Cancel Project
                                            </Button>
                                          )}

                                        {contract.status ===
                                          "Funded (Active)" && (
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                              borderColor:
                                                "rgba(255, 152, 0, 0.4)",
                                              color: "#ffb74d",
                                              "&:hover": {
                                                borderColor: "#ff9800",
                                              },
                                            }}
                                            startIcon={<GavelIcon />}
                                            onClick={() =>
                                              handleRaiseDispute(
                                                contract.escrowAddress
                                              )
                                            }
                                          >
                                            Raise Dispute
                                          </Button>
                                        )}

                                        {contract.status === "Disputed" && (
                                          <>
                                            {contract.userRole ===
                                              "developer" && (
                                              <Button
                                                size="small"
                                                variant="contained"
                                                sx={{
                                                  background:
                                                    "linear-gradient(45deg, #009688 30%, #26a69a 90%)",
                                                  "&:hover": {
                                                    background:
                                                      "linear-gradient(45deg, #00897b 30%, #00838f 90%)",
                                                  },
                                                }}
                                                onClick={() =>
                                                  handleResolveDisputeToDeveloper(
                                                    contract.escrowAddress
                                                  )
                                                }
                                              >
                                                Resolve to Developer
                                              </Button>
                                            )}
                                            {contract.userRole === "funder" && (
                                              <Button
                                                size="small"
                                                variant="contained"
                                                sx={{
                                                  background:
                                                    "linear-gradient(45deg, #9c27b0 30%, #673ab7 90%)",
                                                  "&:hover": {
                                                    background:
                                                      "linear-gradient(45deg, #8e24aa 30%, #5e35b1 90%)",
                                                  },
                                                }}
                                                onClick={() =>
                                                  handleResolveDisputeToFunder(
                                                    contract.escrowAddress
                                                  )
                                                }
                                              >
                                                Resolve to Funder
                                              </Button>
                                            )}
                                          </>
                                        )}
                                      </CardActions>
                                    </Box>
                                  </Collapse>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      )}
                    </>
                  )}
                </Paper>
              </Paper>

              <Alert
                severity="info"
                sx={{
                  mt: 4,
                  bgcolor: "rgba(156, 39, 176, 0.15)",
                  borderColor: "rgba(156, 39, 176, 0.4)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  fontWeight="bold"
                  gutterBottom
                  color="#ba68c8"
                >
                  Important Information:
                </Typography>
                <Typography variant="body2" component="div" color="#ba68c8">
                  • <strong>1.5% Platform Fee:</strong> Applied to each
                  milestone release (deducted from released amount) •{" "}
                  <strong>Gas Fees:</strong> Multiple transactions required
                  (contract deployment, registry registration, approval,
                  funding) • <strong>Permanence:</strong> Contracts are
                  immutable once deployed on blockchain •{" "}
                  <strong>Trust System:</strong> Profile names and avatars
                  fetched from IPFS
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0, mt: 1 }}>
                  <li>
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Connected to {networkInfo.name} network (Chain ID:{" "}
                      {networkInfo.chainId})
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Gas fees paid in {networkInfo.nativeToken}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Custom tokens shown as "CUSTOM" when symbol cannot be
                      fetched
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" component="div" color="#ba68c8">
                      Verify all contract details before deployment
                    </Typography>
                  </li>
                </Box>
              </Alert>

              <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                sx={{
                  "& .MuiSnackbarContent-root": {
                    backgroundColor: "#0a0a0a",
                    color: "#ffffff",
                    border: `1px solid rgba(156, 39, 176, 0.4)`,
                  },
                }}
              >
                <AlertComponent
                  onClose={handleSnackbarClose}
                  severity={snackbarSeverity}
                >
                  {snackbarMessage}
                </AlertComponent>
              </Snackbar>

              {/* Confirmation Dialog */}
              <ConfirmationDialog />

              {/* Gas Fee Warning Dialog */}
              {showGasWarning && (
                <GasFeeWarning
                  title={deploymentData?.projectTitle || "New Contract"}
                  onClose={() => {
                    setShowGasWarning(false);
                    handleDeployContract();
                  }}
                  networkInfo={networkInfo}
                  paymentTokenSymbol={
                    deploymentData?.paymentTokenSymbol || "tokens"
                  }
                />
              )}
            </Container>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default MilestonesPage;
