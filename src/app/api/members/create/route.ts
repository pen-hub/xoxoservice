import { initFirebaseAdmin } from '@/firebase/admin';
import { ROLES } from '@/types/enum';

import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role } = await request.json();

    const admin = await initFirebaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Failed to initialize Firebase Admin' },
        { status: 500 }
      );
    }
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = Object.values(ROLES);
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role.' },
        { status: 400 }
      );
    }

    // Create user account using Firebase Admin SDK (doesn't auto-login)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims with role if provided
    if (role) {
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: role,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: role || null,
      }
    });

  } catch (error: any) {
    console.error('Error creating user account:', error);

    // Handle specific Firebase errors
    let errorMessage = 'Failed to create user account';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email này đã được sử dụng';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email không hợp lệ';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Mật khẩu quá yếu';
    }

    return NextResponse.json(
      { error: errorMessage, code: error.code },
      { status: 400 }
    );
  }
}
