import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSession, clearSession } from '@/lib/auth';
import { getUserById, createGuestUser, getUserByUsername } from '@/lib/userData';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const user = await getUserById(session.id);
  if (!user) {
    // Session is invalid/user deleted
    await clearSession();
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, user });
}

const memoryRooms = new Map<string, { id: string; isPrivate: boolean; password?: string | null }>();

async function getRoom(roomId: string) {
  try {
    return await prisma.room.findUnique({ where: { id: roomId } });
  } catch (e) {
    console.warn("⚠️ Database query failed for getRoom. Falling back to memory.", e);
    return memoryRooms.get(roomId) || null;
  }
}

async function createRoomInDb(roomId: string, isPrivate: boolean, password?: string | null) {
  try {
    return await prisma.room.create({
      data: {
        id: roomId,
        isPrivate,
        password,
      }
    });
  } catch (e) {
    console.warn("⚠️ Database create failed for createRoomInDb. Falling back to memory.", e);
    const newRoom = { id: roomId, isPrivate, password };
    memoryRooms.set(roomId, newRoom);
    return newRoom;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username, email, password } = body;

    if (action === 'room_auth') {
      const { username: roomUsername, roomId, isPrivate, roomPassword, roomAction } = body;

      const cleanUsername = (roomUsername || '').trim();
      const cleanRoomId = (roomId || '').trim();

      if (!cleanUsername || cleanUsername.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
      }

      if (!cleanRoomId || cleanRoomId.length < 3) {
        return NextResponse.json({ error: 'Room ID must be at least 3 characters.' }, { status: 400 });
      }

      // 1. Get or create user
      let user = await getUserByUsername(cleanUsername);
      if (!user) {
        user = await createGuestUser(cleanUsername);
      }

      // 2. Room handling
      if (roomAction === 'create') {
        const existingRoom = await getRoom(cleanRoomId);
        if (existingRoom) {
          return NextResponse.json({ error: 'Room already exists. Choose a different ID or join it.' }, { status: 400 });
        }

        // Create new room
        await createRoomInDb(cleanRoomId, !!isPrivate, isPrivate ? roomPassword : null);
      } else if (roomAction === 'join') {
        const room = await getRoom(cleanRoomId);
        if (!room) {
          return NextResponse.json({ error: 'Room not found. Please check the ID or create it.' }, { status: 404 });
        }

        // Verify password if private
        if (room.isPrivate) {
          if (!roomPassword || room.password !== roomPassword) {
            return NextResponse.json({ error: 'Invalid room password.' }, { status: 401 });
          }
        }
      } else {
        return NextResponse.json({ error: 'Invalid room action.' }, { status: 400 });
      }

      // 3. Set user session
      await setSession({
        id: user.id,
        username: user.username,
        role: user.role,
        avatarCustomization: user.avatarCustomization,
      });

      const fullUser = await getUserById(user.id);
      return NextResponse.json({ success: true, user: fullUser, roomId: cleanRoomId });
    }

    if (action === 'guest') {
      if (!username || username.trim().length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 });
      }

      // Check if username taken
      const existing = await getUserByUsername(username);
      if (existing) {
        return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
      }

      const user = await createGuestUser(username);
      await setSession({
        id: user.id,
        username: user.username,
        role: user.role,
        avatarCustomization: user.avatarCustomization,
      });

      return NextResponse.json({ success: true, user });
    }

    if (action === 'login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
      }

      let user = await getUserByUsername(username);
      
      // For standard development testing, auto-register if they don't exist
      // This is extremely smooth for user testing!
      if (!user) {
        // Create user
        const defaultAvatar = {
          skin: '#ffd1a9',
          hair: 'hair_short_brown',
          eyes: 'default_black',
          face: 'happy',
          shirt: 'shirt_basic_blue',
          pants: 'pants_basic_jeans',
          shoes: 'shoes_sneakers_white',
          hat: 'hat_none',
          glasses: 'glasses_none',
          accessory: 'accessory_none',
          backpack: 'none',
          pet: 'none'
        };
        
        try {
          user = await prisma.user.create({
            data: {
              username,
              email: email || `${username}@pixelverse.com`,
              passwordHash: password, // simple hash for demo
              avatarCustomization: JSON.stringify(defaultAvatar),
            }
          });
        } catch (e) {
          // fallback
          user = await createGuestUser(username);
        }
      }

      await setSession({
        id: user.id,
        username: user.username,
        role: user.role,
        avatarCustomization: user.avatarCustomization,
      });

      const fullUser = await getUserById(user.id);
      return NextResponse.json({ success: true, user: fullUser });
    }

    if (action === 'logout') {
      await clearSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
