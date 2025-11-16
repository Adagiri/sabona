import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Collapse,
  ListItemButton,
} from '@mui/material';
import {
  Home,
  People,
  Business,
  LocalShipping,
  Apps,
  Inventory,
  Map,
  Discount,
  Paid,
  LocalLaundryService,
  ImageOutlined,
  PinDrop,
  Settings,
  AccountBalance,
  PendingActions,
  ExpandLess,
  ExpandMore,
  Category,
  PersonOutline,
  AttachMoney,
  SettingsApplications,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  route: string;
}

interface MenuSection {
  section: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

const menuStructure: (MenuItem | MenuSection)[] = [
  // Top-level items
  { text: 'Dashboard', icon: <Home />, route: '/' },

  // Orders Section
  {
    section: 'Orders',
    icon: <Inventory />,
    items: [
      { text: 'All Orders', icon: <Inventory />, route: '/order' },
      { text: 'Custom Orders', icon: <PinDrop />, route: '/custom-orders' },
    ],
  },

  // Users Section
  {
    section: 'Users',
    icon: <People />,
    items: [
      { text: 'Customers', icon: <PersonOutline />, route: '/customers' },
      { text: 'Vendors', icon: <Business />, route: '/vendor' },
      { text: 'Drivers', icon: <LocalShipping />, route: '/driver' },
    ],
  },

  // Laundry Section
  {
    section: 'Laundry',
    icon: <LocalLaundryService />,
    items: [
      { text: 'Laundries', icon: <Business />, route: '/laundry' },
      { text: 'Categories', icon: <Category />, route: '/laundry/categories' },
      { text: 'Icons', icon: <ImageOutlined />, route: '/icons' },
    ],
  },

  // Finance Section
  {
    section: 'Finance',
    icon: <AttachMoney />,
    items: [
      { text: 'Vouchers', icon: <Discount />, route: '/voucher' },
      { text: 'Tips', icon: <Paid />, route: '/tip' },
      { text: 'Pre-Withdrawals', icon: <PendingActions />, route: '/pre-withdrawals' },
      { text: 'Withdrawals', icon: <AccountBalance />, route: '/withdrawals' },
    ],
  },

  // System Section
  {
    section: 'System',
    icon: <SettingsApplications />,
    items: [
      { text: 'Applications', icon: <Apps />, route: '/application' },
      { text: 'Map Stats', icon: <Map />, route: '/map-stats' },
      { text: 'Settings', icon: <Settings />, route: '/admin-settings' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(() => {
    // Auto-expand section if current route is within it
    const initial: { [key: string]: boolean } = {};
    menuStructure.forEach((item) => {
      if ('section' in item) {
        const isActive = item.items.some((subItem) =>
          location.pathname.startsWith(subItem.route)
        );
        initial[item.section] = isActive;
      }
    });
    return initial;
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isActiveRoute = (route: string) => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <Drawer
      variant='permanent'
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        {menuStructure.map((item, index) => {
          // Section with subitems
          if ('section' in item) {
            const isOpen = openSections[item.section];
            const hasActiveChild = item.items.some((subItem) =>
              isActiveRoute(subItem.route)
            );

            return (
              <React.Fragment key={item.section}>
                <ListItemButton
                  onClick={() => toggleSection(item.section)}
                  sx={{
                    backgroundColor: hasActiveChild ? '#E3F2FD' : 'transparent',
                    '&:hover': { backgroundColor: '#BBDEFB' },
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.section} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={isOpen} timeout='auto' unmountOnExit>
                  <List component='div' disablePadding>
                    {item.items.map((subItem) => (
                      <ListItem
                        key={subItem.text}
                        component={Link}
                        to={subItem.route}
                        sx={{
                          pl: 4,
                          backgroundColor: isActiveRoute(subItem.route)
                            ? '#E3F2FD'
                            : 'transparent',
                          '&:hover': { backgroundColor: '#BBDEFB' },
                          textDecoration: 'none',
                          color: 'inherit',
                          borderRadius: 1,
                          mb: 0.5,
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          // Regular menu item
          return (
            <ListItem
              key={item.text}
              component={Link}
              to={item.route}
              sx={{
                backgroundColor: isActiveRoute(item.route)
                  ? '#E3F2FD'
                  : 'transparent',
                '&:hover': { backgroundColor: '#BBDEFB' },
                textDecoration: 'none',
                color: 'inherit',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
