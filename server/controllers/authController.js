import crypto from 'crypto';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, clientType } = req.body;

    const rawIdentifier = (email || phone || req.body.identifier || '').toString().trim();
    if (!rawIdentifier) {
      res.status(400);
      throw new Error('L\'adresse email ou le numéro de téléphone est requis');
    }

    let userEmail;
    let userPhone;

    if (rawIdentifier.includes('@')) {
      userEmail = rawIdentifier.toLowerCase();
    } else {
      userPhone = rawIdentifier;
    }

    const userExists = await User.findOne({
      $or: [
        ...(userEmail ? [{ email: userEmail }] : []),
        ...(userPhone ? [{ phone: userPhone }] : [])
      ]
    });

    if (userExists) {
      res.status(400);
      throw new Error('Un compte existe déjà avec cet email ou ce numéro de téléphone.');
    }

    const user = await User.create({
      name,
      email: userEmail || undefined,
      phone: userPhone || undefined,
      password,
      clientType: clientType || 'retail'
    });

    if (user) {
      // Initialize user's Cart and Wishlist
      await Cart.create({ user: user._id, items: [] });
      await Wishlist.create({ user: user._id, products: [] });

      // Generate verification token
      const verificationToken = crypto.randomBytes(20).toString('hex');
      user.verificationToken = verificationToken;
      await user.save();

      // Send Welcome / Verification email if user provided an email (non-blocking)
      if (user.email) {
        const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
        sendEmail({
          email: user.email,
          subject: 'Welcome to Nordine Store - Verify your email',
          message: `Welcome to Nordine Store, ${user.name}! Please verify your account by clicking the link: ${verifyUrl}`,
          html: `
            <h1>Welcome, ${user.name}!</h1>
            <p>Thank you for registering at Nordine Store, the premium mobile spare parts marketplace.</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verifyUrl}" style="background-color: #FFC93C; color: #111827; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
            <p>If you did not request this, please ignore this email.</p>
          `
        }).catch(err => console.error('Verification email error:', err.message));
      }

      res.status(201).json({
        success: true,
        message: 'Votre inscription a été enregistrée avec succès. Votre compte est en attente d\'approbation par l\'administrateur.'
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// @desc    Auth user & get token
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const cleanIdentifier = email ? email.toString().trim() : '';

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ]
    }).select('+password');
    if (user && (await user.comparePassword(password))) {
      if (!user.isVerified) {
        res.status(403);
        throw new Error('Votre compte est en attente d\'approbation par l\'administrateur. Vous recevrez un accès complet dès validation.');
      }
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientType: user.clientType,
        avatar: user.avatar,
        addresses: user.addresses,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientType: user.clientType,
        avatar: user.avatar,
        addresses: user.addresses,
        isVerified: user.isVerified
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.avatar) {
        user.avatar = req.body.avatar;
      }
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          password: req.body.password ? user.password : undefined
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        clientType: updatedUser.clientType,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found with that email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes expiration

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Nordine Store - Password Reset Request',
        message: `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`,
        html: `
          <h3>Nordine Store Password Reset</h3>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="background-color: #FFC93C; color: #111827; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          <p>This link is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        `
      });

      res.json({ success: true, message: 'Password reset email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email
// @route   GET /api/auth/verifyemail
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      res.status(400);
      throw new Error('Invalid verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

// Address Management Controllers

// @desc    Add shipping address
// @route   POST /api/auth/address
// @access  Private
export const addUserAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { label, street, city, state, postalCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      label,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault: isDefault || user.addresses.length === 0 // default to true if it is the first address
    });

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shipping address
// @route   PUT /api/auth/address/:addressId
// @access  Private
export const updateUserAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { addressId } = req.params;
    const address = user.addresses.id(addressId);
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    const { label, street, city, state, postalCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    address.label = label || address.label;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state !== undefined ? state : address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.phone = phone || address.phone;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete shipping address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
export const deleteUserAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.addresses.pull(req.params.addressId);
    await user.save();

    // If default address was deleted, make another one default
    if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
      await user.save();
    }

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ name: 1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user
// @route   POST /api/auth/users
// @access  Private/Admin
export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, clientType } = req.body;

    const rawIdentifier = (email || phone || req.body.identifier || '').toString().trim();
    if (!rawIdentifier) {
      res.status(400);
      throw new Error('L\'adresse email ou le numéro de téléphone est requis');
    }

    let userEmail;
    let userPhone;

    if (rawIdentifier.includes('@')) {
      userEmail = rawIdentifier.toLowerCase();
    } else {
      userPhone = rawIdentifier;
    }

    const userExists = await User.findOne({
      $or: [
        ...(userEmail ? [{ email: userEmail }] : []),
        ...(userPhone ? [{ phone: userPhone }] : [])
      ]
    });

    if (userExists) {
      res.status(400);
      throw new Error('Un utilisateur existe déjà avec cet email ou ce numéro de téléphone.');
    }

    const user = await User.create({
      name,
      email: userEmail || undefined,
      phone: userPhone || undefined,
      password,
      role: role || 'client',
      clientType: clientType || 'retail',
      isVerified: true
    });

    await Cart.create({ user: user._id, items: [] });
    await Wishlist.create({ user: user._id, products: [] });

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, email, role, clientType, password, isVerified } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.clientType = clientType || user.clientType;

    if (isVerified !== undefined) {
      user.isVerified = isVerified;
    }

    if (password && password.trim() !== '') {
      user.password = password;
    }

    const updatedUser = await user.save();
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own admin account');
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Import users from Excel file
// @route   POST /api/auth/users/import
// @access  Private/Admin
export const importUsersFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Veuillez téléverser un fichier Excel');
    }

    // Read Excel buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      res.status(400);
      throw new Error('Le fichier Excel est vide');
    }

    const importedUsers = [];
    const updatedUsers = [];
    const skippedUsers = [];

    for (const row of rows) {
      const nameKey = Object.keys(row).find(k => /name|nom/i.test(k));
      const emailKey = Object.keys(row).find(k => /email|mail/i.test(k));
      const passwordKey = Object.keys(row).find(k => /password|mot.*passe|pwd/i.test(k));
      const roleKey = Object.keys(row).find(k => /role|rôle/i.test(k));
      const clientTypeKey = Object.keys(row).find(k => /clientType|type.*client|tarif|famille/i.test(k));
      const refKey = Object.keys(row).find(k => /reference|id|code.*client/i.test(k));

      const name = row[nameKey]?.toString().trim();
      let email = row[emailKey]?.toString().trim().toLowerCase();
      let password = row[passwordKey]?.toString().trim();
      let role = row[roleKey]?.toString().trim().toLowerCase() || 'client';
      let clientType = row[clientTypeKey]?.toString().trim().toLowerCase() || 'retail';
      const referenceVal = row[refKey]?.toString().trim();

      // Extract phone number from contact column
      const contactKey = Object.keys(row).find(k => /contact|téléphone|tel|phone/i.test(k));
      const contactVal = row[contactKey]?.toString().trim();
      let phone = '';
      if (contactVal) {
        phone = contactVal.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      }

      // If email is present, validate and keep it. Otherwise do not generate one.
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (email) {
        email = email.replace(/\s+/g, '').toLowerCase();
        if (!emailRegex.test(email)) {
          email = undefined;
        }
      } else {
        email = undefined;
      }

      if (!name) {
        skippedUsers.push({ row, reason: 'Nom de client manquant' });
        continue;
      }

      // Map clientType (retail, demi-gros, super-gros)
      const cleanType = clientType.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (cleanType === 'sp' || cleanType === 'sg' || cleanType.includes('super') || (cleanType.includes('gros') && !cleanType.includes('demi'))) {
        clientType = 'super-gros';
      } else if (cleanType.includes('demi') || cleanType === 'dg') {
        clientType = 'demi-gros';
      } else {
        clientType = 'retail';
      }

      if (!['client', 'admin'].includes(role)) {
        role = 'client';
      }

      if (!password) {
        password = '123456';
      } else if (password.length < 6) {
        password = password.padEnd(6, '0');
      }

      // Check if user already exists
      let existingUser = null;
      const isValidObjectId = referenceVal && mongoose.Types.ObjectId.isValid(referenceVal);
      if (isValidObjectId) {
        existingUser = await User.findById(referenceVal);
      }
      if (!existingUser && phone) {
        existingUser = await User.findOne({ phone });
      }
      if (!existingUser && email) {
        existingUser = await User.findOne({ email });
      }

      if (existingUser) {
        // Update user
        existingUser.name = name;
        if (email !== undefined) {
          existingUser.email = email;
        }
        existingUser.role = role;
        existingUser.clientType = clientType;
        if (phone) {
          existingUser.phone = phone;
        }
        if (password && password !== '123456') {
          existingUser.password = password;
        }
        await existingUser.save();
        updatedUsers.push({ name, email, role, clientType });
      } else {
        // Create new user
        const newUserObj = {
          name,
          password,
          role,
          clientType,
          isVerified: true
        };
        if (email !== undefined) {
          newUserObj.email = email;
        }
        if (phone) {
          newUserObj.phone = phone;
        }
        if (isValidObjectId) {
          newUserObj._id = referenceVal;
        }
        const newUser = new User(newUserObj);
        await newUser.save();
        importedUsers.push({ name, email, role, clientType });
      }
    }

    res.json({
      success: true,
      message: `Importation terminée. ${importedUsers.length} nouveaux comptes créés, ${updatedUsers.length} comptes mis à jour, ${skippedUsers.length} ignorés.`,
      importedCount: importedUsers.length,
      updatedCount: updatedUsers.length,
      skippedCount: skippedUsers.length,
      importedUsers,
      updatedUsers,
      skippedUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export users/clients to Excel file
// @route   GET /api/auth/users/export
// @access  Private/Admin
export const exportUsersToExcel = async (req, res, next) => {
  try {
    const users = await User.find({});
    
    // Convert to a simple JSON format for Excel
    const data = users.map(user => {
      let identifier = user.phone || '';
      if (!identifier && user.email) {
        if (user.email.endsWith('@nordinestore.dz')) {
          const parts = user.email.split('@');
          if (/^\d+$/.test(parts[0])) {
            identifier = parts[0];
          }
        }
        if (!identifier) {
          identifier = user.email;
        }
      }

      return {
        ID: user._id.toString(),
        Nom: user.name,
        Identifiant: identifier,
        "Mot de passe": '123456',
        Email: user.email,
        Téléphone: user.phone || 'N/A',
        Rôle: user.role,
        "Type de Client": user.clientType || 'retail',
        "Date de Création": user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'
      };
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clients_nordinestore.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
