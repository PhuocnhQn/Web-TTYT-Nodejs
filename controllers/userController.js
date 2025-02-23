const User = require('../models/user');
const bcrypt = require('bcrypt');

// Function to fetch users from MongoDB using async/await
async function fetchUsersFromDatabase() {
    try {
        const users = await User.find({});
        return users;
    } catch (err) {
        throw err;  // You can handle the error here or throw it to be handled later
    }
}

const renderAddUserPage = async (req, res) => {
    try {
        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users, error: null });
    } catch (err) {
        console.error("Error fetching users in renderAddUserPage", err)
        res.status(500).json({
            error: {
                message: "Error fetching users. Please try again.",
                type: 'server'
            },
            serverError: true
        });
    }
};

const addUser = (req, res) => {
    const { name, username, password, role } = req.body;

    bcrypt.hash(password, 10, async (err, hashedPassword) => {
        if (err) {
            console.error("Error hashing password in addUser:", err);
            return res.status(500).json({
                error: {
                    message: 'Error hashing password. Please try again.',
                    type: 'server'
                },
                serverError: true
            });
        }

        const newUser = new User({
            name,
            username,
            password: hashedPassword,
            role
        });

        try {
            await newUser.save();
            const users = await fetchUsersFromDatabase();
            res.render('addUser', { users, error: null });
        } catch (err) {
            console.error("Error saving user in addUser:", err);
            res.status(500).json({
                error: {
                    message: 'Error adding user. Please try again.',
                    type: 'server'
                },
                serverError: true
            });
        }
    });
};

// Route để lấy danh sách người dùng và hiển thị trên trang
const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.render('addUser', { users, error: null });
    } catch (error) {
        console.error('Error fetching users in getUsers:', error);
        res.status(500).json({
            error: {
                message: 'An error occurred while fetching users. Please try again.',
                type: 'server'
            },
            serverError: true
        });
    }
};


// Route để lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user in getUserById:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the user. Please try again.',
            type: 'server'
        });
    }
};

// Route để xóa người dùng theo ID
const deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        await User.findByIdAndDelete(userId);
        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users, error: null });
    } catch (err) {
        console.error('Error deleting user in deleteUser:', err);
        res.status(500).json({
            error: {
                message: 'Error deleting user. Please try again.',
                type: 'server'
            },
            serverError: true
        });
    }
};

// Route to handle updating user details (with optional password update)
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { name, username, role, password } = req.body;

    try {
        const updateData = { name, username, role };

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        await User.findByIdAndUpdate(userId, updateData, { new: true });
        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users, error: null });
    } catch (err) {
        console.error('Error updating user in updateUser:', err);
        res.status(500).json({
            error: {
                message: 'Error updating user. Please try again.',
                type: 'server'
            },
            serverError: true
        });
    }
};

module.exports = {
    renderAddUserPage,
    addUser,
    getUsers,
    getUserById,
    deleteUser,
    updateUser
};