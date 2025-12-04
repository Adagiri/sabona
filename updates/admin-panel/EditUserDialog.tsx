import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import { useEditUser } from '../hooks/Admin/mutations/users';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  level?: 'BASIC' | 'LOYAL' | 'ELITE' | null;
  type: 'USER' | 'VENDOR' | 'RIDER' | 'ADMIN';
}

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, onClose, user }) => {
  const editUserMutation = useEditUser();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: '' as 'ACTIVE' | 'INACTIVE' | 'REJECTED' | '',
    level: '' as 'BASIC' | 'LOYAL' | 'ELITE' | '',
  });

  const [phoneReason, setPhoneReason] = useState('');
  const [emailReason, setEmailReason] = useState('');
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || '',
        level: user.level || '',
      });
      setPhoneReason('');
      setEmailReason('');
      setShowPhoneConfirm(false);
      setShowEmailConfirm(false);
    }
  }, [user, open]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Show confirmation dialogs if phone or email changed
    if (field === 'phone' && value !== user?.phone) {
      setShowPhoneConfirm(true);
    } else if (field === 'phone' && value === user?.phone) {
      setShowPhoneConfirm(false);
      setPhoneReason('');
    }

    if (field === 'email' && value !== user?.email) {
      setShowEmailConfirm(true);
    } else if (field === 'email' && value === user?.email) {
      setShowEmailConfirm(false);
      setEmailReason('');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate phone change reason
    if (showPhoneConfirm && !phoneReason.trim()) {
      return; // Don't submit if phone changed but no reason provided
    }

    // Build the update payload
    const updateData: any = {};

    if (formData.name !== user.name) {
      updateData.name = formData.name || null;
    }
    if (formData.email !== user.email) {
      updateData.email = formData.email || null;
    }
    if (formData.phone !== user.phone) {
      updateData.phone = formData.phone || null;
    }
    if (formData.status && formData.status !== user.status) {
      updateData.status = formData.status;
    }
    if (user.type === 'USER' && formData.level && formData.level !== user.level) {
      updateData.level = formData.level;
    }

    // If no changes, close dialog
    if (Object.keys(updateData).length === 0) {
      onClose();
      return;
    }

    try {
      await editUserMutation.mutateAsync({
        userId: user.id,
        data: updateData,
      });
      onClose();
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const isCustomer = user?.type === 'USER';
  const phoneChanged = formData.phone !== user?.phone;
  const emailChanged = formData.email !== user?.email;
  const phoneReasonRequired = phoneChanged && !phoneReason.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User Profile</DialogTitle>
      <DialogContent>
        {user && (
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Editing {user.type.toLowerCase()}: {user.name || user.phone || user.email}
            </Alert>

            {/* Name */}
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              margin="normal"
              helperText="Full name (2-100 characters)"
            />

            {/* Email */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              margin="normal"
              helperText={emailChanged ? "Email will be updated" : ""}
              error={emailChanged && !formData.email}
            />

            {emailChanged && (
              <TextField
                fullWidth
                label="Email Change Reason (Optional)"
                value={emailReason}
                onChange={(e) => setEmailReason(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                placeholder="Why is the email being changed?"
              />
            )}

            {/* Phone */}
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              margin="normal"
              helperText={phoneChanged ? "⚠️ Phone change requires a reason" : "Saudi format: +966XXXXXXXXX, 05XXXXXXXX"}
              error={phoneReasonRequired}
            />

            {phoneChanged && (
              <>
                <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Phone Number Change Confirmation</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Old number will become available immediately
                  </Typography>
                  <Typography variant="caption" display="block">
                    • User will be notified via push notification
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Change will be logged for audit
                  </Typography>
                </Alert>
                <TextField
                  fullWidth
                  label="Phone Change Reason *"
                  value={phoneReason}
                  onChange={(e) => setPhoneReason(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  required
                  error={phoneReasonRequired}
                  helperText={phoneReasonRequired ? "Reason is required for phone changes" : "Min 10 characters"}
                  placeholder="Why is the phone number being changed?"
                />
              </>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Status */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                {(user.type === 'VENDOR' || user.type === 'RIDER') && (
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Level (only for customers) */}
            {isCustomer && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Level</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  label="Level"
                >
                  <MenuItem value="BASIC">Basic</MenuItem>
                  <MenuItem value="LOYAL">Loyal</MenuItem>
                  <MenuItem value="ELITE">Elite</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={editUserMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={editUserMutation.isPending || phoneReasonRequired}
        >
          {editUserMutation.isPending ? (
            <CircularProgress size={24} />
          ) : (
            'Save Changes'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
