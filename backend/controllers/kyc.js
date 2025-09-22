import User from '../models/User.js';

export const submitKYC = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      country,
      idType,
      idNumber,
      phoneNumber,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // In a production environment, you would upload the document to a secure storage
    // and store the URL instead of the file itself
    const idDocumentUrl = req.file ? 'document_url_placeholder' : null;

    user.kycData = {
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      address,
      city,
      state,
      zipCode,
      country,
      idType,
      idNumber,
      phoneNumber,
      idDocumentUrl,
    };
    user.kycStatus = 'submitted';
    await user.save();

    res.json({ message: 'KYC submitted successfully', status: 'submitted' });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Failed to submit KYC' });
  }
};

export const getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('kycStatus kycData');
    res.json({
      status: user.kycStatus,
      data: user.kycData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get KYC status' });
  }
};

// Admin route to get all KYC submissions
export const getAllKYCSubmissions = async (req, res) => {
  try {
    // Only admin should access this
    const user = req.user;
    console.log(user.isAdmin);
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retrieve users and their KYC data directly (without populate)
    const kycSubmissions = await User.find({}, 'name email kycData'); // Select relevant fields
    res.status(200).json(kycSubmissions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

// export const updateKYCStatus = async (req, res) => {
//   try {
//     // Only admin should access this
//     const user = req.user; // Assumed to be populated with authentication
//     // if (!user.isAdmin) {
//     //   return res.status(403).json({ error: 'Access denied' });
//     // }

//     const { userId, kycStatus } = req.body; // userId and new kycStatus sent from the admin panel

//     // Validate kycStatus
//     if (!['pending', 'submitted', 'approved', 'rejected'].includes(kycStatus)) {
//       return res.status(400).json({ error: 'Invalid KYC status' });
//     }

//     // Find the user and update the kycStatus
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { kycStatus },
//       { new: true, runValidators: true }
//     );

//     // Check if the user exists
//     if (!updatedUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Send updated user data as response
//     res.status(200).json({
//       message: 'KYC status updated successfully',
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: 'Server error', message: error.message });
//   }
// };


export const approveKYCSubmission = async (req, res) => {
  try {
    const user = req.user; // Assumed to be populated with authentication
    // if (!user.isAdmin) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    const { selectedKycId } = req.params; // KYC ID from the URL

    console.log(selectedKycId);
    // Find the user and update KYC status to 'approved'
    const updatedUser = await User.findByIdAndUpdate(
      selectedKycId,
      { kycStatus: 'approved' },
      { new: true, runValidators: true }
    );



   

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'KYC successfully approved',
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

