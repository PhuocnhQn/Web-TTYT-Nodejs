const User = require('../models/user');
const bcrypt = require('bcrypt');

// Function to fetch users from MongoDB using async/await
async function fetchUsersFromDatabase() {
    try {
        return await User.find({});
    } catch (err) {
        console.error("Error fetching users:", err);
        return [];
    }
}

// Render trang thêm user
const renderAddUserPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.redirect('/login');

        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users, user, error: null });
    } catch (err) {
        console.error("Error rendering addUser page:", err);
        res.status(500).json({ error: "Server error while loading users." });
    }
};

// Thêm người dùng mới
const addUser = async (req, res) => {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password || !role) {
        return res.status(400).render('addUser', {
            error: "All fields are required.",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, username, password: hashedPassword, role });
        await newUser.save();
        res.render('addUser', {
            successMessage: "User added successfully!",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).render('addUser', {
            error: "Server error while adding user.",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    }
};


// Lấy danh sách người dùng
const getUsers = async (req, res) => {
    try {
        const users = await fetchUsersFromDatabase();
        res.render('addUser', { users, error: null });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Server error while fetching users." });
    }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ user });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "Server error while fetching user." });
    }
};

// Xóa người dùng theo ID
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).render('addUser', {
            error: "User not found",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });

        res.render('addUser', {
            successMessage: "User deleted successfully!",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).render('addUser', {
            error: "Server error while deleting user.",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    }
};


// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    const { name, username, role, password } = req.body;

    if (!name || !username || !role) {
        return res.status(400).render('addUser', {
            error: "Name, username, and role are required.",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    }

    try {
        const updateData = { name, username, role };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!user) return res.status(404).render('addUser', {
            error: "User not found",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });

        res.render('addUser', {
            successMessage: "User updated successfully!",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).render('addUser', {
            error: "Server error while updating user.",
            user: await User.findById(req.session.userId),
            users: await fetchUsersFromDatabase()
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
