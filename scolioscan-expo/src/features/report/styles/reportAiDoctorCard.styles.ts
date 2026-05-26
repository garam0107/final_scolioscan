import { StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  aiDoctorCard: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 19,
    gap: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    boxShadow: '0px 0px 16px rgba(0, 0, 0, 0.04)',
  },
  aiDoctorTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  aiRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiRiskIconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aiRiskTextWrap: {
    gap: 2,
  },
  aiRiskTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  aiRiskLabel: {
    ...textFont,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  aiRiskLabelNormal: {
    color: Colors.mint[600],
  },
  aiRiskLabelModerate: {
    color: '#D2A31D',
  },
  aiRiskLabelSevere: {
    color: '#EB5858',
  },
  aiOpinionGroup: {
    alignSelf: 'stretch',
  },
  aiOpinionSection: {
    alignSelf: 'stretch',
    gap: 13,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderColor: '#97A2B9',
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  aiOpinionSectionLast: {
    borderBottomWidth: 1,
  },
  aiOpinionHeading: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  aiOpinionBody: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  aiExerciseBlock: {
    gap: 12,
  },
  aiExerciseTitle: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  aiExerciseList: {
    gap: 16,
  },
  aiExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiExerciseThumb: {
    width: 89,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  aiExerciseThumbImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.76,
  },
  aiExerciseTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  aiExerciseName: {
    ...textFont,
    color: '#25272D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  aiExerciseDetail: {
    ...textFont,
    color: Colors.gray[500],
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  pressed: {
    opacity: 0.92,
  },
});

export default styles;
