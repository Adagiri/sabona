# Backend Implementation Instructions
## User Profile Editing Feature with Audit Trail

### Overview
This feature allows admins to edit user profiles (name, email, phone, status, level) with:
- Phone number changes require mandatory reason (audit trail)
- Email changes with optional reason
- Saudi Arabian phone number validation
- Audit logs for all phone and email changes
- Push notifications to users when profile changes
- Cannot edit admin users
- Level field only for customer users

### Files to Update/Create

#### 1. Database Schema
**File:** `prisma/schema.prisma`

**Changes:**
- Add PhoneChangeLog and EmailChangeLog models
- Add relations to User model

**Full updated schema sections:**

```prisma
// At end of User model (around line 238)
  phoneChangeLogs PhoneChangeLog[] @relation("UserPhoneChanges")
  emailChangeLogs EmailChangeLog[] @relation("UserEmailChanges")
  adminPhoneChanges PhoneChangeLog[] @relation("AdminPhoneChanges")
  adminEmailChanges EmailChangeLog[] @relation("AdminEmailChanges")
}

// At end of file (after all existing models)
// Phone change log model to track all phone number changes
model PhoneChangeLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("UserPhoneChanges", fields: [userId], references: [id], onDelete: Cascade)

  oldPhone    String?  // Previous phone number (null if first time setting)
  newPhone    String   // New phone number

  changedBy   String   // Admin ID who made the change
  admin       User     @relation("AdminPhoneChanges", fields: [changedBy], references: [id])

  reason      String   // Reason for the change

  createdAt   DateTime @default(now()) @db.Timestamptz()

  @@index([userId])
  @@index([changedBy])
  @@index([createdAt])
}

// Email change log model to track all email changes
model EmailChangeLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("UserEmailChanges", fields: [userId], references: [id], onDelete: Cascade)

  oldEmail    String?  // Previous email (null if first time setting)
  newEmail    String   // New email

  changedBy   String   // Admin ID who made the change
  admin       User     @relation("AdminEmailChanges", fields: [changedBy], references: [id])

  reason      String?  // Optional reason for the change

  createdAt   DateTime @default(now()) @db.Timestamptz()

  @@index([userId])
  @@index([changedBy])
  @@index([createdAt])
}
```

#### 2. Validation Helper (NEW FILE)
**File:** `src/helpers/validation.helper.ts`

**Purpose:** Saudi phone number and email validation

Copy the entire `validation.helper.ts` file from the updates folder. It includes:
- `isValidSaudiPhone()` - Validates Saudi phone formats
- `normalizeSaudiPhone()` - Converts to +966XXXXXXXXX format
- `isValidEmail()` - Email validation
- `normalizeEmail()` - Lowercase and trim
- `isValidName()` - Name validation (2-100 chars, supports Arabic)
- `formatSaudiPhone()` - Display formatting

#### 3. DTOs (NEW FILES)
**Request DTO:** `src/modules/app/admin/dto/request/editUser.request.ts`
**Response DTO:** `src/modules/app/admin/dto/response/editUser.response.ts`

Copy both files from the updates folder.

#### 4. Admin Service
**File:** `src/modules/app/admin/admin.service.ts`

**Changes:**

a) **Add imports at top (around line 42):**
```typescript
import { EditUserRequestDTO, ChangePhoneRequestDTO, ChangeEmailRequestDTO } from './dto/request/editUser.request';
import { EditUserResponseDTO, ChangePhoneResponseDTO, ChangeEmailResponseDTO } from './dto/response/editUser.response';
import {
    isValidSaudiPhone,
    normalizeSaudiPhone,
    isValidEmail,
    normalizeEmail,
    isValidName,
} from '../../../helpers/validation.helper';
```

b) **Add three new methods at end of class (before closing brace):**

Copy these three methods from the provided `admin.service.ts` file:
- `editUser()` - Lines 1592-1782
- `changeUserPhone()` - Lines 1784-1859
- `changeUserEmail()` - Lines 1861-1936

#### 5. Admin Controller
**File:** `src/modules/app/admin/admin.controller.ts`

**Changes:**

a) **Add imports at top (around line 82):**
```typescript
import { EditUserRequestDTO, ChangePhoneRequestDTO, ChangeEmailRequestDTO } from './dto/request/editUser.request';
import { EditUserResponseDTO, ChangePhoneResponseDTO, ChangeEmailResponseDTO } from './dto/response/editUser.response';
```

b) **Add three new endpoints (before the deleteUser endpoint, around line 882):**
```typescript
@Authorized(UserType.ADMIN)
@Patch({
    path: '/users/:userId/edit',
    description: 'Edit user profile (name, email, phone, status, level)',
    response: EditUserResponseDTO,
})
async editUser(
    @Param('userId') userId: string,
    @Body() data: EditUserRequestDTO,
    @CurrentUser() adminUser: User,
): Promise<EditUserResponseDTO> {
    return this._adminService.editUser(userId, data, adminUser);
}

@Authorized(UserType.ADMIN)
@Post({
    path: '/users/:userId/change-phone',
    description: 'Change user phone number (requires reason)',
    response: ChangePhoneResponseDTO,
})
async changeUserPhone(
    @Param('userId') userId: string,
    @Body() data: ChangePhoneRequestDTO,
    @CurrentUser() adminUser: User,
): Promise<ChangePhoneResponseDTO> {
    return this._adminService.changeUserPhone(userId, data, adminUser);
}

@Authorized(UserType.ADMIN)
@Post({
    path: '/users/:userId/change-email',
    description: 'Change user email address (optional reason)',
    response: ChangeEmailResponseDTO,
})
async changeUserEmail(
    @Param('userId') userId: string,
    @Body() data: ChangeEmailRequestDTO,
    @CurrentUser() adminUser: User,
): Promise<ChangeEmailResponseDTO> {
    return this._adminService.changeUserEmail(userId, data, adminUser);
}
```

#### 6. Database Migration
**Folder:** `prisma/migrations/20251204000000_add_user_change_logs/`
**File:** `migration.sql`

Copy the entire migration folder to your `prisma/migrations/` directory.

### Implementation Steps

1. **Copy all files from updates/backend/ to your backend:**
   ```bash
   # From backend root directory
   cp /path/to/updates/backend/schema.prisma prisma/
   cp /path/to/updates/backend/validation.helper.ts src/helpers/
   cp /path/to/updates/backend/editUser.request.ts src/modules/app/admin/dto/request/
   cp /path/to/updates/backend/editUser.response.ts src/modules/app/admin/dto/response/
   cp /path/to/updates/backend/admin.controller.ts src/modules/app/admin/
   cp /path/to/updates/backend/admin.service.ts src/modules/app/admin/
   cp -r /path/to/updates/backend/20251204000000_add_user_change_logs prisma/migrations/
   ```

2. **Apply database migration:**
   ```bash
   npm run db:migrate
   # Or for production:
   npm run db:deploy
   ```

3. **Regenerate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Restart your backend server:**
   ```bash
   npm run start:dev
   # Or for production:
   npm run start:prod
   ```

### API Endpoints

#### Edit User Profile
```
PATCH /api/v1/admin/users/:userId/edit
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "status": "ACTIVE",
  "level": "LOYAL"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+966501234567",
    "status": "ACTIVE",
    "level": "LOYAL",
    "type": "USER",
    "updatedAt": "2025-12-04T..."
  },
  "message": "User profile updated successfully",
  "changesApplied": ["name", "phone"]
}
```

#### Change Phone
```
POST /api/v1/admin/users/:userId/change-phone
```

**Request Body:**
```json
{
  "newPhone": "+966509876543",
  "reason": "Customer requested phone number update due to lost SIM card"
}
```

#### Change Email
```
POST /api/v1/admin/users/:userId/change-email
```

**Request Body:**
```json
{
  "newEmail": "newemail@example.com",
  "reason": "Customer's old email no longer accessible"
}
```

### Testing Checklist

- [ ] Database migration applied successfully
- [ ] PhoneChangeLog and EmailChangeLog tables exist
- [ ] Edit user endpoint works for all fields
- [ ] Phone change validates Saudi format (+966, 966, 05, 5)
- [ ] Phone change requires reason
- [ ] Email change validates format
- [ ] Cannot edit admin users (returns error)
- [ ] Level can only be set for customers
- [ ] Phone/email uniqueness validated
- [ ] Changes logged to audit tables
- [ ] Push notifications sent to users
- [ ] Partial index for phone still works (deleted users' phones reusable)

### Key Features

✅ **Single `name` field** (not firstName/lastName)
✅ **Saudi phone validation** (supports +966, 966, 05, 5 formats)
✅ **Email validation** (RFC 5322 compliant)
✅ **Phone change requires reason** (mandatory)
✅ **Email change reason optional**
✅ **Push notifications** on profile changes
✅ **Cannot edit admins** (blocked)
✅ **Level only for customers**
✅ **Audit trail** (PhoneChangeLog + EmailChangeLog)
✅ **Uniqueness validation** (respects partial index)
✅ **Immediate phone reuse** (old number available right away)

### Notes

- The editUser endpoint can update multiple fields in one call
- Each change is validated independently
- Only changed fields are returned in `changesApplied` array
- Phone number format is normalized to +966XXXXXXXXX internally
- Email is normalized to lowercase
- All changes create audit log entries
- Push notifications use NotificationService
