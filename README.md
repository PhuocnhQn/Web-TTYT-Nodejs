# Web-TTYT-Nodejs
Web-TTYT-Nodejs
# Web-TTYT-Nodejs: A Web Application for Health Reporting

## Overview

This project is a web application built with Node.js, Express.js, and MongoDB, designed to facilitate health reporting. It allows authorized users to submit, view, edit, and manage health-related reports. The application features role-based access control, data aggregation, and error handling with a modal dialog.

## Features

*   **User Authentication:** Secure login for users with different roles (admin and regular users).
*   **Role-Based Access Control:** Different views and functionalities based on user roles.
*   **Report Management:**
    *   Users can add new reports for their assigned units.
    *   Admins can add new users with different roles
    *   Users can edit their own reports.
    *   Admins can delete any report.
    *   Track report modifications (who changed the data and when).
*   **Report Viewing and Aggregation:**
    *   Users can view their submitted reports for a specific month and year.
    *   Users can view the aggregated values for a specific time period.
    *   Admins can see all reports.
*   **Data Export:** Admins can export reports to an Excel file.
*   **Password Management:** Users can change their passwords.
*  **Error Handling**: Displays errors gracefully using a modal dialog.
*   **Responsive Design:** Basic layout that adapts to different screen sizes.

## Technologies Used

*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB with Mongoose
    *   bcrypt (for password hashing)
    *   exceljs (for Excel export)
*   **Frontend:**
    *   HTML5
    *   CSS3 (Custom Styles)
    *   JavaScript (with DOM Manipulation)
    * EJS templating

## Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/PhuocnhQn/Web-TTYT-Nodejs.git
    cd Web-TTYT-Nodejs
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set up MongoDB:**
    - Make sure you have MongoDB installed and running.
    -  Create a `.env` file in the root of the project with the following:
    ```
    MONGODB_URI=your_mongodb_connection_string
    SESSION_SECRET=your_session_secret
    ```
     -  Make sure to change `your_mongodb_connection_string` with your actual MongoDB connection string, and `your_session_secret` with a secret that is used for your session management.

4.  **Start the Application:**
    ```bash
    npm start
    ```

5. **Access the Application**:
 - The application will be running at `http://localhost:3000`.

## Database Setup

*   Make sure you have a database called `web-tyt`.

*   The application uses Mongoose to interact with the database. The following models are used:
    *   **User Model**: Stores user information including `name`, `username`, `password` (hashed), and `role`.
    *  **Report Model**: Stores report information, including `userId`, `totalVisits`, `childrenUnder14`, `visitsWithIDExcludingChildren`, `reportingUnit`, `month`, `year`, `birthCertificate`, `deathCertificate`, and `percentage`, and an array of modifications.

## Usage

1.  **Access the Application**: Open your web browser and access the application at `http://localhost:3000`.

2.  **Login**: Use the login form to log in as either an admin user or a regular user.

3.  **Navigation:** Use the navigation menu to navigate to different pages:
      -   **Trang chủ (Dashboard)**: Shows the list of reports, with options to add, edit and delete them.
      -   **Thêm User (Add User)**: (Admin only) used to add new users.
      -  **Xem Báo Cáo (View Reports)**: Displays a list of reports for a given month and year.
      - **Xem Báo Cáo Tổng Hợp (View Aggregated Reports)**: Displays the sum of reports for a given date range.
       -  **Đổi mật khẩu (Change Password)**: Allows you to change your password.
       -   **Đăng xuất (Logout)**: Logs you out from the application.

4.  **Report Submission and Management**:
     - On the dashboard you can add a new report, edit existing reports, or delete reports (if you are an admin)
     - If you are not an admin, you will not have the option to delete a report.

5.  **View Reports:**
    - On the `Xem Báo Cáo` page select a month and a year to display reports for that specific time.
     - On the `Xem Báo Cáo Tổng Hợp` you will need to select a start month/year and an end month/year.

6. **Export Reports**:
    - On the `Xem Báo Cáo` page click on the Xuất button to download a spreadsheet of the reports.

7.  **Error Handling:**
    *   When an error occurs, a modal dialog will be displayed to inform the user.

## File Structure

-   `public/`: Contains static assets like CSS, and JavaScript files.
-   `routes/`: Contains route definitions for your application,
-   `controllers/`: Contains the route handlers.
-   `models/`: Contains Mongoose schema for your data models.
-   `services/`: Contains any reusable or independent services that do not require any controller context.
-   `middlewares/`: Contains middleware that you might need for authentication or authorization.
-   `views/`: Contains the EJS template files.
-  `app.js` (or `index.js`): The main file for running your express server.
- `package.json` File where you have all the packages necessary for your project.

## Important Considerations

*   **Security**:  Make sure to sanitize any user input to prevent vulnerabilities like XSS or SQL Injection.
* **More comprehensive tests:** Make sure to add more tests for different scenarios that might exist.
* **Scalability:**  If you expect a lot of users, you might need to optimize database queries, add caching, or configure a reverse proxy.
*   **Error Handling:** Review all the code for any unhandled errors, and log those.

## Contributing

To contribute to this project you can clone the repository, and create a pull request with your changes. Make sure to test your code locally and that it aligns with the current coding standards of the project.

## License

This project is licensed under the **MIT License**.

## Contact

phuocnh.hiepz@gmail.com