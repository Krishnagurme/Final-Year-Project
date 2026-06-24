import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import Course from '../models/Course.js';


const router = express.Router();

// Get all certificates for the current user
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const certificates = await Certificate.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ 
      success: true,
      data: certificates 
    });
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch certificates' 
    });
  }
});

// Get a single certificate by ID
router.get('/:certificateId', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId).lean();

    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }

    // Verify ownership
    if (certificate.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    res.json({ 
      success: true,
      data: certificate 
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch certificate' 
    });
  }
});

// Generate a certificate for a course (when eligible)
router.post('/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ 
        success: false,
        message: 'Course ID is required' 
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Get course enrollment
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Find enrollment in user's courses
    const enrolledCourse = user.enrolledCourses?.find(
      e => e.courseId.toString() === courseId
    );

    if (!enrolledCourse) {
      return res.status(400).json({ 
        success: false,
        message: 'Not enrolled in this course' 
      });
    }

    // Check eligibility: completed course with certificateEligible flag
    if (enrolledCourse.status !== 'completed' && (enrolledCourse.progress || 0) < 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Course not completed (less than 100% progress)' 
      });
    }

    if (!enrolledCourse.certificateEligible && enrolledCourse.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Certificate not yet eligible. Complete all course topics first.',
      });
    }

    if (enrolledCourse.certificateObtained) {
      return res.status(400).json({ 
        success: false,
        message: 'Certificate already issued for this course' 
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({ userId, courseId });
    
    if (!certificate) {
      // Create new certificate
      const certificateNumber = `LS-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
      
      const verificationToken = `verify-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      certificate = new Certificate({
        userId,
        courseId,
        studentName: user.name,
        courseName: course.title,
        studentEmail: user.email,
        certificateNumber,
        verificationToken,
        issuedAt: new Date(),
        status: 'active',
        skills: course.category ? [course.category] : [],
        metadata: {
          progress: enrolledCourse.progress,
          grade: enrolledCourse.grade,
        }
      });

      await certificate.save();
    }

    // Mark certificate as obtained in user's course
    if (!enrolledCourse.certificateObtained) {
      enrolledCourse.certificateObtained = true;
      enrolledCourse.certificateIssuedAt = new Date();
      await user.save();
    }

    res.json({ 
      success: true,
      message: 'Certificate generated successfully',
      data: certificate 
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate certificate' 
    });
  }
});

// Verify a certificate using verification token
router.get('/verify/:verificationToken', async (req, res) => {
  try {
    const { verificationToken } = req.params;

    const certificate = await Certificate.findOne({ verificationToken }).lean();

    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }

    if (certificate.status !== 'active') {
      return res.status(400).json({ 
        success: false,
        message: 'Certificate is not active' 
      });
    }

    res.json({ 
      success: true,
      data: {
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        verified: true
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to verify certificate' 
    });
  }
});

// Download certificate (returns JSON or PDF)
router.get('/:certificateId/download', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { certificateId } = req.params;
    const { format = 'json' } = req.query;

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }

    // Verify ownership
    if (certificate.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    if (format === 'json') {
      // Return as JSON
      res.json({ 
        success: true,
        data: certificate 
      });
    } else if (format === 'pdf') {
      // Try to get PDF URL if available
      if (certificate.certificateUrl) {
        // In a real scenario, you'd redirect to the PDF URL or stream it
        res.json({ 
          success: true,
          pdfUrl: certificate.certificateUrl 
        });
      } else {
        res.status(400).json({ 
          success: false,
          message: 'PDF not available for this certificate' 
        });
      }
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid format' 
      });
    }
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to download certificate' 
    });
  }
});

// Share certificate (get shareable link)
router.post('/:certificateId/share', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        message: 'Certificate not found' 
      });
    }

    // Verify ownership
    if (certificate.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const shareLink = `${baseUrl}/certificate/verify/${certificate.verificationToken}`;

    res.json({ 
      success: true,
      shareLink,
      verificationToken: certificate.verificationToken
    });
  } catch (error) {
    console.error('Error sharing certificate:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to share certificate' 
    });
  }
});

export default router;
